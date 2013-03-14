function Reitsuki(container,opt){
	this.container = container;
	
	this.opt = opt == undefined ? {} : opt;
	this.width = (opt.width == undefined) ? window.innerWidth : opt.width;
	this.height = ( opt.height == undefined) ? window.innerHeight : opt.height;
	this.displaySpeed = (opt.displaySpeed == undefined) ? 100 : opt.displaySpeed;
	
	//创建舞台
	this.stage = new Kinetic.Stage({
		container:this.container,
		width: this.width,
		height: this.height
	});
	
	this.BK = new Kinetic.Layer(); //背景层
	this.CH = new Kinetic.Layer(); //角色层
	this.Text1 = new Kinetic.Layer(); //文字层1
	this.Text2 = new Kinetic.Layer(); //文字层2
	this.MASK = new Kinetic.Layer(); //笼罩层
	this.UI = new Kinetic.Layer(); //UI层
	
	this.stage.add(this.BK);
	this.stage.add(this.CH);
	this.stage.add(this.Text1);
	this.stage.add(this.Text2);
	this.stage.add(this.MASK);
	this.stage.add(this.UI);
	
	//填充黑色背景
	
	this.BK.add(new Kinetic.Rect({
		x:0,
		y:0,
		width:this.width ,
		height:this.height,
		fill:"black"
	}));
	this.BK.draw();
	
	this.Global = {}; //全局变量空间
	this.SNameSpace = {}; //脚本执行完,或跳出时 此命名空间的东西会被清空,存档的话就会把存档内容装入到这里
	this.CurrentScriptName = ""; //当前脚本名
	this.CurrentScriptLine = 0; //当前脚本行
	this.CurrentScriptContent = null;
	
	if(opt.script != undefined){
		this.CurrentScriptName = "RAW";
		this.CurrentScriptContent = this.Parser(opt.script);
	}else if(opt.scriptFile != undefined){
		//装载脚本文件
		var fileContent = "???";
		this.CurrentScriptName = opt.scriptFile;
		this.CurrentScriptContent = this.Parser(fileContent);
	}
	
	this.isStop = false; //结束游戏标志
	this.isWait = false;//是否等待任何按键
	Reitsuki.prototype._Tools._rei = this; //设置工具空间的_rei 对象为引擎本身
}

//开始游戏
Reitsuki.prototype.start = function(){
	var self = this;
	var aGL;
	var gameLoop = function(f){
		if(self.isStop){
			console.log("GameStop");
			aGL.stop();
		}
		if(self.CurrentScriptLine < self.CurrentScriptContent.length){
			var script = self.CurrentScriptContent[self.CurrentScriptLine];
			
			if(self.isWait){
				//是否等待任何按键
				return;
			}
			switch(script.type){
				case "JS":{
					var js = script.content.data;
					//self._Tools.execJScript(js);
					break;
				}
				case "LINE":{
					var contents = script.content;
					for(var i =0,l = contents.length; i < l; i++){
						var content = contents[i];
						if( typeof content == "string"){
							self._Tools.PrintScriptText(content);
							//输出文字
						}else{
							//switch(content.type)
						}
					}
					break;
				}
			}
			self.CurrentScriptLine++; //下一行
		}
	};


	aGL = new Kinetic.Animation(gameLoop);
	aGL.start();

};

//接结束游戏
Reitsuki.prototype.stop = function(){
	this.isStop = true;
};

// 脚本命令处理工具空间
Reitsuki.prototype._Tools = {};

Reitsuki.prototype._Tools.PrintScriptText = function(str){
	//剧本框里的字符串
	var self = this;
	var textDisplayLooper;
	var sTime = new Date().getTime();
	var nowText = "";
	var nowTextIndex = 0;
	var NowTextLineNum = 0;
	var textArr = str.split("\n");
	
	var kText = new Kinetic.Text({
		x:0,
		y:0,
		text:"",
		fontSize:18,
		fill:"white",
		fontFamily:"Tahoma,Arial,Helvetica,sans-serif",
		width:self._rei.width,
		height:40,
		align:"left"
	});
	var lineHeightPx = kText.getLineHeight() * kText.getTextHeight();
	var oldDrawFunc = kText.drawFunc;
	self._rei.Text1.add(kText);
	
	
	
	for(var i = 0, l= textArr.length; i < l; i++){
		textArr[i] = $.trim(textArr[i]);
	}
	
	function textDisplay(frame){
		var nowTime = new Date().getTime();
		if(nowTime - sTime >= self._rei.displaySpeed){

			if(false){
				nowText = "";
				kText.parent.clear(); //清屏
				kText.parent.draw();
				
			}

			//打字效果显示剧本
			if(NowTextLineNum < textArr.length){
				if(nowTextIndex < textArr[NowTextLineNum].length){
					nowText += textArr[NowTextLineNum][nowTextIndex];
					nowTextIndex++;
				}else{
					//换行 //清屏幕
					nowText += "\n";
					nowTextIndex = 0;
					NowTextLineNum++;

				}
				//绘制字符
				kText.setText(nowText);
				kText.parent.clear();
				kText.parent.draw();
			}else{
				textDisplayLooper.stop();
			}
			sTime = new Date().getTime();
		}
	}
	
	textDisplayLooper =  new Kinetic.Animation(textDisplay);
	textDisplayLooper.start();
	this._rei.isWait = true;
};

Reitsuki.prototype._Tools.VarCMD = function(cmd){
	//解析变量命令和执行变量命令
	var cmd = $.trim(cmd);
	if(cmd[0] == "$"){
		var varName = cmd.substring(1);
		var val = null;
		if(this._rei.SNameSpace[varName] != undefined){
			val = this._rei.SNameSpace[varName];
		}
		
		if(this.Global[varName] != undefined){
			val = this._rei.SNameSpace[varName];
		}
		
		return val;
	}
	//处理变量值
};

Reitsuki.prototype._Tools.callFunction = function(cmd){
	//执行脚本条用的函数
	var paramArr = [];
	var funcName = "";
	var bIndex = 0;
	if( (bIndex = cmd.indexOf(" ")) > 0){
		funcName = $.trim(cmd.substr(0,bIndex));
		var paramStr = $.trim(cmd.substring(bIndex));
		try{
			paramArr = $.parseJSON("["+paramStr+"]");
		}catch(e){
			cosole.log("Call JS Function Error:param in line" + this.CurrentScriptLine + "@"+ this.CurrentScriptName);
			return false;
		}
	}else{
		funcName = $.trim(cmd);
	}
	
	if(this._rei.SNameSpace[funcName] != undefined  ){
		this._rei.SNameSpace[funcName].call(paramArr);
	}else if(this._rei.Global[funcName] != undefined ){
		this._rei.Global[funcName].call(paramArr);
	}
};

Reitsuki.prototype._Tools.execJScript = function(str){
	//执行JS
	this.self = this._rei.SNameSpace;
	this.global = this._rei.Global;
	
	eval(str);
};

Reitsuki.prototype._Tools.execGScript = function (str){
	//执行预设的剧本命令
	var funcName = "";
	var paramObject = {};
	
	var tmpArr = str.split(" ");
	for(var i=0,l=tmpArr.length; i < l; i++){
		var kv = tempArr[i].split(":");
		if(i == 0){
			funcName = kv[0];
			if(kv.length == 2){
				paramObject.o = kv[1];
			}else{
				paramObject[kv[0]] = kv[1];
			}
		}
	}
	
	if(funcName != ""){
		this._rei.Global[funcName].call(paramObject);
	}
};

//剧本Parser
Reitsuki.prototype.Parser = function scriptParser(scriptContent){
	//脚本预处理
	var scriptLines = $.trim(scriptContent.replace(/^\/\/.+\r?\n/gm,"")).split("\n");
	var scriptTree = [];
	var isInScriptBlock = false;
	var scriptBlock = null;
	var resultTree = []; //最终Parse结果
	$.each(scriptLines,function(index,val){
		var line = val.replace("\r",'');
		//判断是否在脚本的JS区域里
		var trimLine = $.trim(line);
		if(trimLine == "-+script+-"){
			isInScriptBlock = true;
			scriptBlock = []; //开始接收脚本区块
			return;
		}
		if(trimLine == "-+/script+-"){
			//脚本区块结束
			isInScriptBlock = false;
			//JS 内容
			var scriptObj = {data:scriptBlock.join('\r\n')};
			scriptTree.push(scriptObj);
			scriptBlock = null;
			return;
		}
		if(isInScriptBlock == true){
			scriptBlock.push(line);//压入脚本行
			return;
		}
		
		//去除行尾的注释
		line = line.replace(/\/\/.*/g,"");
		if(trimLine == ''){
			scriptTree.push(line);
			return;
		}else{
			if(typeof(scriptTree[scriptTree.length-1]) == 'object' ){
				scriptTree.push(''); //如果上一行是JS对象的话则插入一行空行
			}
			if(trimLine == '\\'){
				scriptTree[scriptTree.length-1] += '\r\n';
			}else{
				scriptTree[scriptTree.length-1] += '\r\n' + line;
			}
			scriptTree[scriptTree.length-1] = $.trim(scriptTree[scriptTree.length-1]);
		}
	});
	
	//处理脚本段落 生成语法树
	//以行为一个节点
	var scriptNodeList = [];
	var timeSym =  ['-+','[','{','<','-|','-*'];
	var timeSym2 = ['+-',']','}','>','|-','*-'];
	//这里有问题 
	$.each(scriptTree,function(index,val){
		var line = {type:"",content:[]};
		if(typeof(val) == "object"){
			scriptNodeList.push({type:"JS",content:val}); //压入js块
			return;
		}
		
		var tLine = [];
		for(var i=0,l=val.length; i<l; i++){
			var text = val.substr(i,l-i);
			var onlyText = true;
			var obj = null;
			
			//搜索是不是有脚本命令在这行中
			for(var ci=0,timeSym_l = timeSym.length; ci < timeSym_l; ci++){
				var sym = timeSym[ci];

				if(text.indexOf(sym) == 0){
					//获得时值内容
					var startIndex = text.indexOf(sym)+sym.length;
					var endSym = timeSym2[ci];
					var endIndex = text.indexOf(endSym) - endSym.length;
					var content = text.substr(startIndex,endIndex);
					onlyText = false;
					i += (text.indexOf(endSym) + endSym.length) ;
					
					//var scriptObj = {timeType:'0',type:"",data:content};
					switch(sym){
						case '-+':{break;} //忽略脚本(JS块)
						case '[':{
							//行命令
							var lobj = {type:"LINE_CMD",content:content};
							scriptNodeList.push(lobj);
							break;
						}
						case '{':{
							//行内命令
							obj = {type:"INLINE_CMD",content:content};
							break;
						}
						case '<':{
							//瞬时命令
							obj = {type:"INST_CMD",content:content};
							break;
						}
						case '-|':{
							// 变量命令
							obj = {type:"VAR_CMD",content:content};
							break;
						}
						case '-*':{
							//标签命令
							var lObj = {type:"LABEL_CMD",content:content};
							scriptNodeList.push(lObj);//当作行处理
							break;
						}
					}
					
				}
			}
			
			if(onlyText){
				tLine.push(val[i]);
			}else if(obj != null){
				tLine.push(obj) ;
			}
			
		}
		//合并tLine中的文字
		var tmpStr = "";
		for(var i = 0,l=tLine.length; i <l; i++){
			if( typeof tLine[i] == "string" ){
					tmpStr += tLine[i];
			}else{
				if( $.trim(tmpStr) != ""){
					line.content.push(tmpStr);
				}
				tmpStr = "";
				line.content.push(tLine[i]); //压入对象
			}
		}
		//检查最后是否还有没有字符没有压入行对象里
		if($.trim(tmpStr) != ""){
			line.content.push(tmpStr);
			tmpStr = "";
		}
		line.type = "LINE";
		scriptNodeList.push(line);
	});
	return scriptNodeList;
};