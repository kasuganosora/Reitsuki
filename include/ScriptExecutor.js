/**
 * @author sorakasugano
 */

Reitsuki.ScriptExecutor  = function(scriptManager){
    this.scriptName = "RAW";
    this.codes = null;
    this.ip = 0;
    this.labelMaps = {};
    this.needSaveData = {};
    this._lastExpResult = null;
    this._outTextLabel = "ScriptDispBox";
    this.scriptManager = scriptManager;
    this._vars = {};
    this._libs = {};

};

/**
 * loading Reitsuki script string
 * @param {String}script
 */
Reitsuki.ScriptExecutor.prototype.loadScript = function(script){
    this.codes = [];
    this.ip = 0;
    this.labelMaps = {};
    // parser the script;
    var reader = new Reitsuki.ScriptExecutor.Reader(script);
    var scanner = new Reitsuki.ScriptExecutor.Scanner(reader);
    var parser = new Reitsuki.ScriptExecutor.Parser(scanner);
    this.codes = parser.parse();

    for(var i = 0,l = this.codes.expressions.length; i < l; i++){
        var exp =  this.codes.expressions[i];
        if(exp instanceof  Reitsuki.Expression.GameScriptLabelNode){
            this.labelMaps[exp.labelName] = i;
        }
    }

};

Reitsuki.ScriptExecutor.prototype.saveGame = function(){
    var ip = this.ip -1;
    if(ip > this.codes.expressions.length){
        ip =  this.codes.expressions.length-1;
    }
    return {global:this._vars,environ:this.needSaveData,ip:ip };
};

Reitsuki.ScriptExecutor.prototype.loadGame = function(data){
    this.scriptManager.messageCenter.broadcast("LOADEVENT",null);

    this._vars = data.global;

    for(var key in data.environ){
        if(data.environ.hasOwnProperty(key)){
            var cmd = data.environ[key];
            this[cmd.functionName].apply(this,cmd.params);
        }
    }

    this.ip = data.ip;
};

Reitsuki.ScriptExecutor.prototype._argToArray = function(arg){
    var reslut = [];
    for(var i = 0; i < arg.length; i++){
        reslut.push(arg[i]);
    }
    return reslut;
};

/**
 * Next Code
 * @returns {boolean} false is end of stream
 */
Reitsuki.ScriptExecutor.prototype.next = function(){
    if(!this.codes || this.ip > this.codes.expressions.length){
        return false;
    }
    var exp = this.codes.expressions[this.ip];
    this._exeExpression(exp);
    this.ip++;
    return true;
};

/**
 * execute Reitsuki expression
 * @param exp expression node
 * @private
 */
Reitsuki.ScriptExecutor.prototype._exeExpression = function(exp){
    if(exp instanceof Reitsuki.Expression.JavaScriptNode){
       this._eval(exp);
       return;
    }

    if(exp instanceof  Reitsuki.Expression.GameScriptGotoNode){
        var params = this._proc_pramas(exp.params);
        if(params.length >1){
            this.scriptManager.loadScriptToFile(params[1]);
            this.Goto(params[0]);
            return;
        }else{
            this.Goto(params[0]);
        }
    }

    if(exp instanceof  Reitsuki.Expression.GameScriptBlockNode){
        this.outputString(exp.content);
        return;
    }

    if(exp instanceof  Reitsuki.Expression.GameScriptCallFunctionNode){
        this._callFunction(exp);
        return;
    }

};

/**
 * eval javascript code
 * @param node
 * @private
 */
Reitsuki.ScriptExecutor.prototype._eval = function (node){
    var global = this._vars;
    this._lastExpResult = null;
    try{
        var script = typeof node === "string" ? node : node.scriptText;
        this._lastExpResult = eval(script);
    }catch (e){
        if(node.line !== undefined){
            e.message = "ScriptLine: " + node.line  + " " + e.toString();
        }else{
            var nowExp = this.codes.expressions[this.ip-1];
            e.message = "ScriptLine: " + nowExp.line  + " " + e.toString();
        }
        throw e;
    }
};

/**
 * goto label; In Reitsuki Code: is @goto "labelname","fileName",
 * option filename
 * @param {String}label
 * @constructor
 */
Reitsuki.ScriptExecutor.prototype.Goto = function(label){
    if(!this.labelMaps.hasOwnProperty(label)){
        var line = this.codes.expressions[this.ip].line;
        throw new Error("Line " + line + "has not label:" + label);
    }

    this.ip = this.labelMaps[label];
};

/**
 * Out put text to game screen
 * @param text
 */
Reitsuki.ScriptExecutor.prototype.outputString = function (text){
    var reg = /\$([a-z0-9A-Z_]+)/g;
    var m = text.match(reg);
    if(m){
        for(var i = 0,l= m.length; i < l; i++){
            var varName = m[i].substr(1);
            if(this._vars.hasOwnProperty(varName)){
                text = text.replace(new RegExp("\\$"+varName,"gm"),this._vars[varName]);
            }
        }
    }
   var chResult = this._procCHImageAndVoice(text);
    text = chResult.text;
    var CMDS = [];
    var textComponent = this._outTextLabel + "Component";
    if(chResult.chCMD){
        CMDS.push(chResult.chCMD);
    }

    if(chResult.voice){
        CMDS.push(this.scriptManager.createCMD("VoiceComponent","play",{name:chResult.voice}));
    }
    CMDS.push(this.scriptManager.createCMD(textComponent,"setText",{text:text}));

   // CMDS.push(this.scriptManager.createCMD("CHComponent","clearCharacter",{}));
    this.scriptManager.CMDS.push(CMDS);

};


/**
 * set Character image
 *   春日野穹(笑),诗音(高兴),夏川真凉：今天的天气真好
 * @param text
 * @returns {*}
 * @private
 */
Reitsuki.ScriptExecutor.prototype._procCHImageAndVoice = function(text){
    // 处理脚本中的立绘  ：全角
    // Exp 春日野穹(笑),诗音(高兴),夏川真凉：今天的天气真好
    var colonIndex;
    if((colonIndex = text.indexOf("：")) == -1){
        return {text:text, chCMD:null};
    }

    var chImageSetting = text.substr(0,colonIndex).split(",");
    var  reg = /(\S+?)\((\S+?)\)/g;
    var character = [];
    var chNams = [];
    var voice = null;
    for(var i = 0,l = chImageSetting.length; i < l; i++){
        var m = reg.exec(chImageSetting[i]);
        if(m){
           var name = m[1];
           var value = m[2];
           var realName = "";
            if(name.toLowerCase() == "voice"){
               voice = value;
            }else{
                realName = name;
                if(name.charAt(0) === '-'){
                    realName =  name.substr(1);
                }else{
                    realName = name;

                    //别名
                    var rIndex = realName.indexOf(":");
                    if(rIndex > 0){
                        // 因为不能以:开头  例如  :春日野穹(笑)
                        var aliases = realName.substr(0,rIndex);
                        chNams.push(aliases);
                        realName = realName.substr(rIndex+1);
                    }else{
                        chNams.push(realName);
                    }

                }
                character.push({charName:realName,charNum:value});
            }

        }else{
            chNams.push(chImageSetting[i]);
        }
        reg.lastIndex = 0;
    }

    text = chNams.join(',') + "：" + text.substr(colonIndex+1);
    var result = {};
    if(character.length > 0){
        result.chCMD = this.scriptManager.createCMD("CHComponent","setCharacter",{character:character});
    }else{
        result.chCMD = null;
    }
    result.voice = voice;
    result.text = text;
    return result;
};

/**
 * parser cmd pramas
 * @param {Array}prams
 * @returns {Array}
 * @private
 */
Reitsuki.ScriptExecutor.prototype._proc_pramas = function(prams){
     var result = [];
    for(var i = 0,l = prams.length; i < l; i++){
        var pram = prams[i];

        if(pram instanceof  Reitsuki.Expression.OtherStringNode){
            this._eval(pram.data);
            result[i] = this._lastExpResult;
            continue;
        }

        if(pram instanceof  Reitsuki.Expression.StringNode){
            result[i] = pram.data;
            continue;
        }
    }
    return result;
};

/**
 * call function in Reitsuki Code
 * exp @log "helloworld"
 *
 * @param exp
 * @private
 */
Reitsuki.ScriptExecutor.prototype._callFunction = function(exp){
    var funcName = exp.functionName;
    var prams = this._proc_pramas(exp.params);
    var line = exp.line;
    try{
        if( typeof this[funcName] === "function" ){
            this._lastExpResult = this[funcName].apply(this,prams);
            return;
        }else if(this._libs.hasOwnProperty(funcName)) {
            this._lastExpResult = this._libs[funcName].apply(this,prams);
            return;
        }else if(this._vars.hasOwnProperty(funcName)){
            this._lastExpResult =  this._vars[funcName].apply(this,prams);
            return;
        }

    }catch(e){
        console.log("Script Line:" + line + " " + e.toString() + "\r\n");
    }

    throw new ReferenceError("Script Line:" + line + " has not method: " + funcName);
};

/**
 * If in ReitsukiCode
 * exp @if a == 1,"gotoLabelName"
 * @param exp
 * @param label
 * @constructor
 */
Reitsuki.ScriptExecutor.prototype.If = function(exp,label){
    if(this._lastExpResult){
        this.Goto(label);
    }
};

/**
 * set game background music in Reitsuki Code
 * exp @setBGM "EV001"
 * @param bgm
 */
Reitsuki.ScriptExecutor.prototype.setBGM = function(bgm){
    this.needSaveData.BGM = {functionName:"setBGM",params:this._argToArray(arguments)};
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("BGMComponent","play",{name:bgm})
    ]);
};

Reitsuki.ScriptExecutor.prototype.stopBGM = function(){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("BGMComponent","stop",{})
    ]);
};

Reitsuki.ScriptExecutor.prototype.setVoice = function(voice){
    this.needSaveData.voice = {functionName:"setVoice",params:this._argToArray(arguments)};
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("VoiceComponent","play",{name:voice})
    ]);
};

Reitsuki.ScriptExecutor.prototype.stopVoice = function(){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("VoiceComponent","stop",{})
    ]);
};

Reitsuki.ScriptExecutor.prototype.setSound= function(sound){
    this.needSaveData.Sound = {functionName:"setSound",params:this._argToArray(arguments)};
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("SoundComponent","play",{name:sound})
    ]);
};

Reitsuki.ScriptExecutor.prototype.stopSound = function(){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("SoundComponent","stop",{})
    ]);
};

Reitsuki.ScriptExecutor.prototype.setBG = function(img,speed){
    this.needSaveData.BG = {functionName:"setBG",params:this._argToArray(arguments)};
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("BGComponent","setBG",{img:img,speed:speed})
    ]);
};

Reitsuki.ScriptExecutor.prototype.setBGColor = function(color,speed){
    this.needSaveData.BG = {functionName:"setBGColor",params:this._argToArray(arguments)};
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("BGComponent","setBGColor",{color:color,speed:speed})
    ]);
};

Reitsuki.ScriptExecutor.prototype.jitterScriptBox = function(){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("ScriptDispBoxComponent","jitter",{})
    ]);
};

Reitsuki.ScriptExecutor.prototype.hideScriptBox = function(){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("ScriptDispBoxComponent","hide",{})
    ]);
};

Reitsuki.ScriptExecutor.prototype.showScriptBox = function(){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("ScriptDispBoxComponent","show",{})
    ]);
};

Reitsuki.ScriptExecutor.prototype.clearScriptBox = function(){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("ScriptDispBoxComponent","clear",{})
    ]);
};

Reitsuki.ScriptExecutor.prototype.dailog = function(id,callback){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("DialogComponent","show",{id:id,callback:callback})
    ]);
};
Reitsuki.ScriptExecutor.prototype.setCH = function(name,chNum){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("CHComponent","setCharacter",{character:{
            charName:name,
            charNum:chNum
        }})
    ]);
};

Reitsuki.ScriptExecutor.prototype.clearCH = function(){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("CHComponent","clearCharacter",{})
    ]);
};

Reitsuki.ScriptExecutor.prototype.selectBox = function(){
   if(arguments.length % 2 !== 0){
       throw new Error("The format must 'selectBox 'slectItem1','label1','selectItem2','label2' '");
   }
   var selextItems = [];
   var selectItemMap = {};

    for(var i = 0, l = arguments.length; i < l; i++){
        if( (i+1) % 2 == 1){
            selextItems.push(arguments[i]);
        } else{
            selectItemMap[arguments[ i-1 ]] = arguments[i];
        }
    }

    var self = this;
    var callback = function(selectText){
        console.log(selectText);
        if(selectItemMap[selectText] && self.labelMaps[ selectItemMap[selectText] ]){
            self.Goto(selectItemMap[selectText]);
        }else{
            var line = self.codes.expressions[self.ip -1 ].line;
            throw new Error("Line " + line + "has not label:" + selectItemMap[selectText]);
        }
    };
    var prams = {item:selextItems,callback:callback};

    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("SelectBoxComponent","setSelectItem",prams)
    ]);
};

Reitsuki.ScriptExecutor.prototype.video = function(mp4,webm,ogg){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("VideoComponent","play",{mp4:mp4,webm:webm,ogg:ogg})
    ]);
};

Reitsuki.ScriptExecutor.prototype.wait = function(time){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("SysComponent","wait",{time:time})
    ]);
};

/**
 * set environment variable in ReitsukiScript
 * name bg_width
 */
Reitsuki.ScriptExecutor.prototype.set = function (){
    var name = arguments[0];
    var compName = "";
    var nameTmpArr = name.split("_");
    var methodName = nameTmpArr[1].toLowerCase();

    switch (nameTmpArr[0]){
        case "sb":
            compName = "ScriptDispBoxComponent";
        break;
        case "sel":
            compName = "SelectBoxComponent";
        break;
        default :
            compName = nameTmpArr[0] + "Component";
    }

    var args = [];
    for(var i = 1; i < arguments.length; i++){
        args.push(arguments[i]);
    }

    var comp = this.scriptManager.messageCenter.getComponent(compName);

    for(var cName in comp){
        if(cName.substr(0,3) != "set" || typeof comp[cName] != "function" ){
            continue;
        }
        if(cName.substr(3).toLowerCase() == methodName){
            comp[cName].apply(comp,args);
            return;
        }
    }
    console.log("Script Line:"+ (this.ip -1) +" Not found method:set" + methodName + " in Component: " + compName);
};

// Reader
Reitsuki.ScriptExecutor.Reader = function(str){
    if(str === undefined){
        str = "";
    }
    this.data = str;
    this.currPos = 0;
    this.dataLength = str.length;
};

Reitsuki.ScriptExecutor.Reader.prototype.nextChar = function (){
    if(this.currPos >= this.dataLength){
        return -1; // end of stream
    }

    if(this.data[this.currPos + 1] == '\r' && this.data[this.currPos + 2] == '\n'){
        this.currPos += 2;
        return this.data[this.currPos];
    }
    return this.data[this.currPos++];
};

Reitsuki.ScriptExecutor.Reader.prototype.retract = function (n){
    if(n === undefined){
        n =1;
    }
    this.currPos -= n;
    if(this.currPos < 0){
        this.currPos = 0;
    }
};


Reitsuki.ScriptExecutor.Scanner = function(reader){
    this.reader = reader;
    this.currentToken = new Reitsuki.ScriptExecutor.Token(null,null);
    this.currLine = 0; //the line number of current line being read
    this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
    this.inProc_GAMEDEFINEDFUNCTION_STATE = false; //processing  GAMEDEFINEDFUNCTION_STATE
    this.skipNewLine = true;
    this._bufferStr = "";
};

Reitsuki.ScriptExecutor.Scanner.START_STATE = 1;
Reitsuki.ScriptExecutor.Scanner.IDENTIFIER_STATE = Reitsuki.ScriptExecutor.Scanner.START_STATE + 1;
Reitsuki.ScriptExecutor.Scanner.JavaScriptBlock_STATE = Reitsuki.ScriptExecutor.Scanner.IDENTIFIER_STATE + 1;
Reitsuki.ScriptExecutor.Scanner.GAMEDEFINEDFUNCTION_STATE = Reitsuki.ScriptExecutor.Scanner.JavaScriptBlock_STATE + 1;
Reitsuki.ScriptExecutor.Scanner.OTHER_STRING_STATE = Reitsuki.ScriptExecutor.Scanner.GAMEDEFINEDFUNCTION_STATE +1;
Reitsuki.ScriptExecutor.Scanner.STRING_STATE = Reitsuki.ScriptExecutor.Scanner.OTHER_STRING_STATE + 1;
Reitsuki.ScriptExecutor.Scanner.GAMESCRIPT_STRING_STATE = Reitsuki.ScriptExecutor.Scanner.STRING_STATE + 1;

Reitsuki.ScriptExecutor.Scanner.prototype.makeToken = function(type,text){
    this.currentToken.type = type;
    this.currentToken.text = text;
    this._bufferStr = "";
    return type;
};

Reitsuki.ScriptExecutor.Scanner.prototype.nextToken  = function(){
    this._bufferStr = "";
    var Scanner = Reitsuki.ScriptExecutor.Scanner;
    var Tokens =  Reitsuki.ScriptExecutor.Token.tokens;
    var ret;

    while(true){
         switch(this.state){
             case Scanner.START_STATE:
                 var c = this.reader.nextChar();

                 if( c == "\n" || c =='\r' ){
                     this.currLine++;
                     this.inProc_GAMEDEFINEDFUNCTION_STATE = false;
                     if (! this.skipNewLine){
                         return this.makeToken(Tokens.NEWLINE_TOKEN,null);
                     }
                     continue;
                 }

                 if(c == -1){
                     return this.makeToken(Tokens.EOS_TOKEN,null);
                 }

                 if(this.inProc_GAMEDEFINEDFUNCTION_STATE){
                     switch(c){
                         case "'":case '"':
                            this.state = Scanner.STRING_STATE;
                            this._bufferStr = c;
                         break;

                         case ",":
                             return this.makeToken(Tokens.COMMA_TOKEN,null);


                         case ";":
                             return this.makeToken(Tokens.SEMICOLON_TOKEN,null);

                         default :
                             this.state = Scanner.OTHER_STRING_STATE;
                     }
                 }else{
                     this.state = Scanner.GAMESCRIPT_STRING_STATE;
                 }


             break;

             case Scanner.GAMEDEFINEDFUNCTION_STATE:
                 ret = this._proc_GAMEDEFINEDFUNCTION_STATE();
                 if(ret != null){
                     return ret;
                 }
             break;

             case Scanner.JavaScriptBlock_STATE:
                 ret = this._proc_JavaScriptBlock_STATE();
                 if(ret != null){
                     return ret;
                 }
             break;

             case Scanner.GAMESCRIPT_STRING_STATE:
                 ret = this._proc_GAME_SCRIPT_STRING_STATE();
                 if(ret != null){
                     return ret;
                 }
             break;

             case Scanner.STRING_STATE:
                 ret = this._proc_string();
                 if(ret != null){
                     return ret;
                 }
             break;

             case Scanner.OTHER_STRING_STATE:
                 ret = this._proc_OTHER_STRING_STATE();
                 if(ret != null){
                     return ret;
                 }
             break;
         }
     }
};

Reitsuki.ScriptExecutor.Scanner.prototype._proc_GAME_SCRIPT_STRING_STATE = function(){
    var c,nc;
    this._bufferStr = "";
    var lines = [];
    var end = false;
    var firstLine = true;
    var TOKENS =  Reitsuki.ScriptExecutor.Token.tokens;
    this.reader.retract();

    while(!end){
        c = this.reader.nextChar();
        if(c == "@"){
            if(lines.length > 0){
                this.reader.retract();
                this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
                return this.makeToken(TOKENS.GAMESCRIPTSTRING_TOKEN,lines.join("\r\n"));
            }

            nc = this.reader.nextChar();
            if(nc == "{"){
                // @{
                //切换到处理脚本状态
                this.state = Reitsuki.ScriptExecutor.Scanner.JavaScriptBlock_STATE;
                return null;
            }

            if( ( nc >= "a" && c <= "z") || (nc >= "A" && c <= "Z") || nc == '_'){
                this.state = Reitsuki.ScriptExecutor.Scanner.GAMEDEFINEDFUNCTION_STATE;
                this._bufferStr = nc;
                return null;
            }
        }


        if(c === -1 && Reitsuki._trim(this._bufferStr) !== ""){
            this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
            lines.push(this._bufferStr);
            return this.makeToken(TOKENS.GAMESCRIPTSTRING_TOKEN,lines.join("\r\n"));
        }

        if (c === -1 && lines.length !== 0){
            break;
        }

        if (c == -1){
            this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
            return null;
        }
        if (c != "\r" && c != "\n"){
            this._bufferStr += c;

            if (firstLine === true && Reitsuki._trim(this._bufferStr) !== "" ){
                firstLine = false;
            }
        }else{
            this.currLine++;

            this._bufferStr = Reitsuki._trim(this._bufferStr);
            if( this._bufferStr === "" && firstLine === false ){
                end =  true;
            }

            if ( this._bufferStr === "" && firstLine === true){
                c = this.reader.nextChar();
                continue; // 跳过前面的空白字符
            }

            if ( this._bufferStr !== "" && firstLine === true){
                firstLine = false;
            }

            lines.push(this._bufferStr);
            this._bufferStr = "";
        }
    }

    this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
    return this.makeToken(TOKENS.GAMESCRIPTSTRING_TOKEN,lines.join("\r\n"));
};

Reitsuki.ScriptExecutor.Scanner.prototype._proc_JavaScriptBlock_STATE = function(){
    var TOKENS =  Reitsuki.ScriptExecutor.Token.tokens;
    this._bufferStr = "";
    var c = this.reader.nextChar();
    var nc = this.reader.nextChar();
    while(c !=  -1){
        if(c == "}" &&  nc == "@"){
            break;
        }

       this._bufferStr += c;
       if(c == "\r" || c == "\n"){
           this.currLine++;
       }
       c = nc;
       nc = this.reader.nextChar();

    }

    this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
    return this.makeToken(TOKENS.JS_TOKEN,this._bufferStr);
};

Reitsuki.ScriptExecutor.Scanner.prototype._proc_GAMEDEFINEDFUNCTION_STATE = function(){
    var c = this._bufferStr;
    this._bufferStr = "";
    var TOKENS =  Reitsuki.ScriptExecutor.Token.tokens;

    while ( c != ' ' && c != "\r" && c != "\n" ){
        this._bufferStr += c;
        c = this.reader.nextChar();
    }
    var funcName = this._bufferStr;





    if(c != '\r' && c != '\n'){
        this.inProc_GAMEDEFINEDFUNCTION_STATE  = true;
        this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
    }else{
        this.currLine++;
        this.inProc_GAMEDEFINEDFUNCTION_STATE = false;
        this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
    }


    switch (funcName){
        case "goto":
            return this.makeToken(TOKENS.GAMESCRIPT_GOTO_TOKEN,null);

        case "label":
            return this.makeToken(TOKENS.GAMESCRIPT_LABEL_TOKEN,null);

        default:
            return  this.makeToken(TOKENS.GAMESCRIPT_IDENTIFIER_TOKEN,funcName);
    }
};

Reitsuki.ScriptExecutor.Scanner.prototype._proc_string = function (){
    var TOKENS =  Reitsuki.ScriptExecutor.Token.tokens;
    var c = this.reader.nextChar();
    var quotesType = this._bufferStr;
    this._bufferStr = "";
    var preChar = "";

    while ( true ){
        if ( (c == quotesType && preChar != "\\") || c == -1 ){
            break;
        }

        this._bufferStr += c;
        preChar = c;
        c = this.reader.nextChar();
        if ( c == "\n" || c == "\r" ){
            this.currLine++;
        }
    }

    var tokenType = TOKENS.STRING_TOKEN;
    var subBuffer = "";
    // fix exp "aaaa" + aaa = ortherString
    if(this.inProc_GAMEDEFINEDFUNCTION_STATE){
        c = this.reader.nextChar();
        while(true){
            if( c == ";" || c == -1 || c == "\n" || c == "\r" || c == ","){
                if(c == "\n" || c == "\r" || c == ','){
                    this.reader.retract();

                }
                break;
            }
            subBuffer += c;
            c = this.reader.nextChar();

        }
        if(Reitsuki._trim(subBuffer) !== ''){
            this._bufferStr = '"' + this._bufferStr + '"' +  subBuffer;
            tokenType = TOKENS.OTHER_STRING_TOKEN;
        }
    }

    this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
    return this.makeToken(tokenType,this._bufferStr);
};

Reitsuki.ScriptExecutor.Scanner.prototype._proc_OTHER_STRING_STATE = function(){
    var TOKENS =  Reitsuki.ScriptExecutor.Token.tokens;
    this.reader.retract();
    var c = this.reader.nextChar();
    this._bufferStr = "";

    while(true){
        if( c == ";" || c == -1 || c == "\n" || c == "\r" || c == ","){
            if(c == "\n" || c == "\r" || c == ','){
                this.reader.retract();
            }
            break;
        }
        this._bufferStr += c;
        c = this.reader.nextChar();

    }

    this.state = Reitsuki.ScriptExecutor.Scanner.START_STATE;
    return this.makeToken(TOKENS.OTHER_STRING_TOKEN,this._bufferStr);
};



// Parser
Reitsuki.ScriptExecutor.Parser = function(scanner){
    this.scanner = scanner;
    this.currentToken = new  Reitsuki.ScriptExecutor.Token(null,null);
    this.lookaheadToken = new  Reitsuki.ScriptExecutor.Token(null,null);
    this.lookaheadToken.consumed = true;
};

Reitsuki.ScriptExecutor.Parser.prototype.nextToken = function(){
    var token;
    var TOKENS = Reitsuki.ScriptExecutor.Token.tokens;
    if(this.lookaheadToken.consumed){
        token = this.scanner.nextToken();
        while(
            token == TOKENS.LINECOMMENT_TOKEN ||
                token == TOKENS.BLOCKCOMMENT_TOKEN
            ){
            token = this.scanner.nextToken();
        }
        this.currentToken.type = token;
        this.currentToken.text = this.scanner.currentToken.text;
        return token;
    }else{
        this.currentToken.type = this.lookaheadToken.type;
        this.currentToken.text = this.lookaheadToken.text;
        this.lookaheadToken.consumed = true;
        return this.currentToken.type;
    }
};

Reitsuki.ScriptExecutor.Parser.prototype.lookahead = function(){
    var token;
    var TOKENS = Reitsuki.ScriptExecutor.Token.tokens;
    if(this.lookaheadToken.consumed){
        token = this.scanner.nextToken();
        while(
            token == TOKENS.LINECOMMENT_TOKEN ||
                token == TOKENS.BLOCKCOMMENT_TOKEN
            ){
            token = this.scanner.nextToken();
        }

        this.lookaheadToken.type = token;
        this.lookaheadToken.text = this.scanner.currentToken.text;
        this.lookaheadToken.consumed = false;
        return token;
    }else{
        return this.lookaheadToken.type;
    }

};

Reitsuki.ScriptExecutor.Parser.prototype.matchNewLine = function(){
    var TOKENS = Reitsuki.ScriptExecutor.Token.tokens;
    this.scanner.skipNewLine = false;

    //consume the semicolon
    if(this.lookahead() == TOKENS.NEWLINE_TOKEN || this.lookahead() == TOKENS.EOS_TOKEN ){
        this.nextToken();
    }else{
        Reitsuki.ScriptExecutor.Errors.setError(
            Reitsuki.ScriptExecutor.Errors.TYPE.SYNTAX_ERROR,
            "Expecting a new line at the end of expression",
            this.scanner.currLine
        );
    }
    this.scanner.skipNewLine = true;
};


Reitsuki.ScriptExecutor.Parser.prototype.skipError = function(){
    this.scanner.skipNewLine = false;
    var TOKENS = Reitsuki.ScriptExecutor.Token.tokens;
    while (this.lookahead() != TOKENS.NEWLINE_TOKEN && this.lookahead() != TOKENS.EOS_TOKEN){
        this.nextToken();
    }
    this.scanner.skipNewLine = true;
};

Reitsuki.ScriptExecutor.Parser.prototype.parse = function(){
    var root = new Reitsuki.Expression.ExpressionBlockNode();
    this.parseExpressions(root);
    return root;
};

Reitsuki.ScriptExecutor.Parser.prototype.parseExpressions = function(expressionBlockNode){
    var TOKENS = Reitsuki.ScriptExecutor.Token.tokens;
    while ( this.lookahead() != TOKENS.RIGHTBRACE_TOKEN && this.lookahead() != TOKENS.EOS_TOKEN){
        var expressionNode = this.parseExpression();
        if(expressionNode){
            expressionBlockNode.push(expressionNode);
        }
    }
};

Reitsuki.ScriptExecutor.Parser.prototype.parseExpression = function(){
    var TOKENS = Reitsuki.ScriptExecutor.Token.tokens;
    switch (this.lookahead()){
        case TOKENS.GAMESCRIPTSTRING_TOKEN:
            this.nextToken();
            return new Reitsuki.Expression.GameScriptBlockNode(this.currentToken.text).setLine(this.scanner.currLine);


        case TOKENS.GAMESCRIPT_GOTO_TOKEN:
            this.nextToken();
            return this.parseGameScriptGotoExpression().setLine(this.scanner.currLine);


        case TOKENS.GAMESCRIPT_LABEL_TOKEN:
            return this.parseGameScriptLabelExpression().setLine(this.scanner.currLine);


        case TOKENS.GAMESCRIPT_IDENTIFIER_TOKEN:
            return this.parseGameScriptCallFunction().setLine(this.scanner.currLine);


        case TOKENS.JS_TOKEN:
            this.nextToken();
            return new Reitsuki.Expression.JavaScriptNode(this.currentToken.text).setLine(this.scanner.currLine);


        case TOKENS.STRING_TOKEN:
            this.nextToken();
            return new Reitsuki.Expression.StringNode(this.currentToken.text).setLine(this.scanner.currLine);


        case TOKENS.OTHER_STRING_TOKEN:
            this.nextToken();
            return new Reitsuki.Expression.OtherStringNode(this.currentToken.text).setLine(this.scanner.currLine);

        default :
            this.nextToken();
    }
};

Reitsuki.ScriptExecutor.Parser.prototype.parseGameScriptCMDParams = function(){
    var params = [];
    var expression = null;
    var TOKEN = Reitsuki.ScriptExecutor.Token.tokens;

    this.scanner.skipNewLine = false;
    while (this.lookahead() != TOKEN.NEWLINE_TOKEN && this.lookahead() != TOKEN.EOS_TOKEN &&
        this.lookahead() != TOKEN.SEMICOLON_TOKEN){

        if(this.lookahead() != TOKEN.COMMA_TOKEN){
            expression = this.parseExpression();

        }else{
            params.push(expression);
            expression = null;
            this.nextToken();
        }
    }

    if(expression != null){
        params.push(expression);
    }
    if(this.lookahead() == TOKEN.SEMICOLON_TOKEN){
        this.nextToken();
    }
    this.scanner.skipNewLine = true;
    return params;
};


Reitsuki.ScriptExecutor.Parser.prototype.parseGameScriptGotoExpression = function(){
    // consume @Goto
    var params = this.parseGameScriptCMDParams();
    this.matchNewLine();

    return new Reitsuki.Expression.GameScriptGotoNode(params);
};
Reitsuki.ScriptExecutor.Parser.prototype.parseGameScriptLabelExpression = function(){
    var TOKEN = Reitsuki.ScriptExecutor.Token.tokens;
    // consume @label
    this.nextToken();
     var labelName = "";
    if(this.lookahead() == TOKEN.STRING_TOKEN){
        this.nextToken();
        labelName = this.currentToken.text;
        this.matchNewLine();
        return new Reitsuki.Expression.GameScriptLabelNode(labelName);
    }else{
        this.skipError();
    }

};

Reitsuki.ScriptExecutor.Parser.prototype.parseGameScriptCallFunction   = function(){
    var funcName;

    var TOKEN = Reitsuki.ScriptExecutor.Token.tokens;
    // consume @
    this.nextToken();
    funcName = this.currentToken.text;
    var params = this.parseGameScriptCMDParams();
    this.matchNewLine();
    return new Reitsuki.Expression.GameScriptCallFunctionNode(funcName,params);
};

//-----------------
(function(Reitsuki){
  // Token
  var i,l;
  Reitsuki.ScriptExecutor.Token = function(type,text){
        this.type = type;
        this.text = text;

    };
  Reitsuki.ScriptExecutor.Token.tokens = {};
  Reitsuki.ScriptExecutor.Token.backwardMap = {};
  var tokenENUM = [
    "EOS_TOKEN",
    "JS_TOKEN",
    "NEWLINE_TOKEN",
    "EMPTYLINE_TOKEN",
    "COMMA_TOKEN",
    "SEMICOLON_TOKEN",
    "DOT_TOKEN",
    "STRING_TOKEN",
    "OTHER_STRING_TOKEN",
    "GAMESCRIPTSTRING_TOKEN",
    "GAMESCRIPT_GOTO_TOKEN",
    "GAMESCRIPT_LABEL_TOKEN",
    "GAMESCRIPT_IDENTIFIER_TOKEN",
    "GAMESCRIPT_IF_TOKEN",
    "GAMESCRIPT_SELECT_TOKEN",
    "LINECOMMENT_TOKEN",
    "BLOCKCOMMENT_TOKEN"
  ];

  for( i = 0,l = tokenENUM.length; i < l; i++){
      var tokenName = tokenENUM[i].toUpperCase();
      Reitsuki.ScriptExecutor.Token.tokens[tokenName] = i;
      Reitsuki.ScriptExecutor.Token.backwardMap[i] = tokenName;
  }

  // Errors
    Reitsuki.ScriptExecutor.Errors = {};
    Reitsuki.ScriptExecutor.Errors.errors = [];
    Reitsuki.ScriptExecutor.Errors.setError = function(errorType,message,lineNumber){
        Reitsuki.ScriptExecutor.Errors.errors.push({
            type: errorType,
            message:message,
            line:lineNumber
        });
    };
    Reitsuki.ScriptExecutor.Errors.each = function(callback){
        var errs = Reitsuki.ScriptExecutor.Errors.errors;
        var errBackwardMap = Reitsuki.ScriptExecutor.Errors.backwardMap;
        for(var i = 0,l = errs.length; i < l; i++){
            var err = errs[i];
            err.typeName = errBackwardMap[i];
            callback(err);
        }
    };

    Reitsuki.ScriptExecutor.Errors.clear = function(){
        Reitsuki.ScriptExecutor.Errors.errors = [];
    };

    var errorTypeEnum = [
        "SYNTAX_ERROR",
        "SEMANTIC_ERROR",
        "RUNTIME_ERROR"
    ];

    Reitsuki.ScriptExecutor.Errors.TYPE = {};
    Reitsuki.ScriptExecutor.Errors.backwardMap  ={};
   for( i = 0, l= errorTypeEnum.length; i < l; i++){
       var errTypeName = errorTypeEnum[i];
       Reitsuki.ScriptExecutor.Errors.TYPE[errTypeName] = i;
       Reitsuki.ScriptExecutor.Errors.backwardMap[i] =  errTypeName;
   }


  // ExpressionNode
  Reitsuki.Expression = {};
  function Node(){
      this.line = 0;
      this.valueType = -1;
  }
  Node.prototype.setLine = function(line){
      this.line = line;
      return this;
  };
  Reitsuki.Expression.Node = Node;

  function JavaScriptNode(scriptText){
      this.scriptText = scriptText;
  }

  Reitsuki.extend(JavaScriptNode,Node);
  Reitsuki.Expression.JavaScriptNode = JavaScriptNode;


    function ExpressionBlockNode(){
      this.expressions = [];
    }
    Reitsuki.extend(ExpressionBlockNode,Node);

    ExpressionBlockNode.prototype.push = function(expressionBlock){
        this.expressions.push(expressionBlock);
    };

    ExpressionBlockNode.prototype.iterate = function(func){
        for (var i = 0, l = this.expressions.length; i < l; i++){
            var expression = this.expressions[i];
            func(expression, i);
        }
    };

    Reitsuki.Expression.ExpressionBlockNode = ExpressionBlockNode;

    function StringNode(data){
        this.data = data;
    }
    Reitsuki.extend(StringNode,Node);
    Reitsuki.Expression.StringNode = StringNode;

    function OtherStringNode(data){
        this.data = data;
    }
    Reitsuki.extend(OtherStringNode,Node);
    Reitsuki.Expression.OtherStringNode = OtherStringNode;


    function CompoundNode(){
        this.nodes = [];
    }
    Reitsuki.extend(CompoundNode,Node);
    CompoundNode.prototype.push = function(node){
        this.nodes.push(node);
    };
    Reitsuki.Expression.CompoundNode = CompoundNode;


    function GameScriptGotoNode(params){
        this.params = params;
    }
    Reitsuki.extend(GameScriptGotoNode,Node);
    Reitsuki.Expression.GameScriptGotoNode = GameScriptGotoNode;


    function GameScriptLabelNode (labelName){
        this.labelName = labelName;
    }
    Reitsuki.extend(GameScriptLabelNode,Node);
    Reitsuki.Expression.GameScriptLabelNode = GameScriptLabelNode;


    function GameScriptBlockNode (content){
        this.content = content;
    }
    Reitsuki.extend(GameScriptBlockNode,Node);
    Reitsuki.Expression.GameScriptBlockNode = GameScriptBlockNode;

    function GameScriptCallFunctionNode(funcName,params){
        this.functionName = funcName;
        this.params = params;
    }
    Reitsuki.extend(GameScriptCallFunctionNode,Node);
    Reitsuki.Expression.GameScriptCallFunctionNode = GameScriptCallFunctionNode;
})(Reitsuki);
