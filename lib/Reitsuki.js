function Reitsuki(container,opt){
	this.container = container;
	
	this.opt = opt == undefined ? {} : opt;
	this.width = (opt.width == undefined) ? window.innerWidth : opt.width;
	this.height = ( opt.height == undefined) ? window.innerHeight : opt.height;
	this.displaySpeed = (opt.displaySpeed == undefined) ? 100 : opt.displaySpeed;
	this.charactersSetting = (opt.charactersSetting == undefined) ? {} :opt.charactersSetting;

	//剧本框样式
	this.scriptFontFamily = (opt.scriptFontFamily == undefined) ? "Tahoma,Arial,Helvetica,sans-serif" : opt.scriptFontFamily;
	this.scriptFontColor = (opt.scriptFontColor == undefined) ? "white" : opt.scriptFontColor;
	this.scriptFontSize = (opt.scriptFontSize == undefined) ? 18 : opt.scriptFontSize;
	this.scriptBoxPosX = (opt.scriptBoxPosX == undefined) ? 0 : opt.scriptBoxPosX;
	this.scriptBoxPosY = (opt.scriptBoxPosX == undefined) ? 0 : opt.scriptBoxPosY;
	this.scriptBoxHeight = (opt.scriptBoxHeight == undefined) ? this.height : opt.scriptBoxHeight;
	this.scriptBoxWidth = (opt.scriptBoxWidth == undefined) ? this.width : opt.scriptBoxWidth;
	this.scriptTextAlign = (opt.scriptTextAlign == undefined) ? "left" : opt.scriptTextAlign;
	
	
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
	
	//初始化剧本框显示文字对象
	this.kText = new Kinetic.Text({
		x:this.scriptBoxPosX,
		y:this.scriptBoxPosY,
		text:"",
		fontSize:this.scriptFontSize,
		fill:this.scriptFontColor,
		fontFamily:this.scriptFontFamily,
		width:this.scriptBoxWidth,
		height:this.scriptBoxHeight,
		align:this.scriptTextAlign
	});

	
	this.isStop = false; //结束游戏标志
	this.isWait = false;//是否等待任何按键
	this.isPassKey = false; //按下任何键的时候设置的标志
	Reitsuki.prototype._Tools._rei = this; //设置工具空间的_rei 对象为引擎本身
	
	this.NowBGM 	= 	new Audio(); //当前背景音乐
	this.NowVoice 	= 	new Audio(); //当前语音
	this.NowSound 	= 	new Audio(); // 当前音效
	this.InitScriptFuncs();
	
	this.scriptExecer = new ScriptExecer(null,this.Text1,100,this.kText.attrs,this._runScript,this.setCharImg,this); //测试
	
	//事件容器
	this.eventList = {};
	
	//绑定电击背景的事件
	var self = this;
	this.bind("click_BK_CHT_TEXT",function(){
		if(self.isWait == true){
			self.isWait = false;
		}else{
			self.scriptExecer.pressKey();
		}
	});
};

//事件绑定
Reitsuki.prototype.bind = function(eventName,handle){
	if(typeof handle != "function"){
		return false;
	}
	
	if(this.eventList[eventName] == undefined){
		this.eventList[eventName] = [];
	}
	
	this.eventList[eventName].push(handle);
};

//接触绑定事件
Reitsuki.prototype.unBind = function(eventName,handle){
	var eventList = this.eventList;
	switch(eventName){
		case "click_BK_CHT_TEXT":{
			this.BK.off("click");
			this.CH.off("click");
			this.Text1.off("click");
			this.Text2.off("click");
			this.__removeEventToList(eventName,handle);
			this.__bindEvents("click",handles,[this.BK,this.Text1,this.Text2,this.CH]);
			break;
		}
		default:{
			this.__removeEventToList(eventName,handle);
		}
	}
};

Reitsuki.prototype.listenEvent = function(){
	
	var eventList = this.eventList;
	var listCount = 0;
	for(var obj in eventList){
		if(!eventList.hasOwnProperty(obj)){
			continue;
		}
		//绑定Kinetic上的Obj事件
		switch(obj){
			case "click_BK_CHT_TEXT":{
				var handles = eventList[obj];
				this.__bindEvents("click",handles,[this.BK,this.Text1,this.Text2,this.CH]);
				break;
			}
			
		}
	}
};

Reitsuki.prototype.__removeEventToList = function(eventName,handle){
	var eventList = this.eventList;
	if(eventList[eventName] == undefined){
		return;
	}
	if(handle == undefined){
		eventList[eventName] = [];
		return;
	}
	
	var newEvents = [];
	for(var i = 0,l = eventList[eventName].length; i <l; i++){
		if(eventList[eventName][i] != handle){
			newEvents.push(eventList[eventName][i]);
		}
	}
	eventList[eventName] = newEvents;
};

Reitsuki.prototype.__bindEvents = function(eventName,handles,objs){
	if(objs == undefined || objs.length == 0){
		return;
	}

	for(var i =0,l=objs.length; i<l; i++){
		var obj = objs[i];
		for(var h = 0,hl = handles.length; h <hl; h++){
			var handle = handles[h];
			obj.on(eventName,handle);
		}
	}
};

Reitsuki.prototype.__execEvent = function(eventName,info){
	var eventList = this.eventList;
	if(eventList[eventName] == undefined){
		return;
	}
	
	for(var i = 0,l = eventList[eventName].length; i <l; i++){
		eventList[eventName][i](eventName,info);
	}
};

//开始游戏
Reitsuki.prototype.start = function(){
	var self = this;
	var aGL;
	var scriptDispComp = false;
	var sTime = new Date().getTime();
	var wait_scBoxUpdate = false;
	
	this.listenEvent(); //开始探听事件
	
	var gameLoop = function(f){
		if(self.isStop){
			aGL.stop();
		}
		if(self.isWait){
			return;
		}
		
		if(wait_scBoxUpdate && !self.scriptExecer.complete ){
			//当到达最后一个脚本的时候就不只更新对话框
			self.scriptExecer.update();
			if(self.scriptExecer.complete){
				wait_scBoxUpdate = false;//复位
			}
			return;
		}
		
		var script;
		if(self.CurrentScriptLine < self.CurrentScriptContent.length){
			script = self.CurrentScriptContent[self.CurrentScriptLine];
		}
		
		if(script == undefined){
	
			return;
		}

		if(self.CurrentScriptLine +1 >= self.CurrentScriptContent.length){
			wait_scBoxUpdate = true;
		}

		//打印剧本文字
		if(self.scriptExecer.complete && script.type == "LINE"){
			var contents = script.content;
			self.scriptExecer.setContents(contents);
			self.scriptExecer.complete = false;
			self.CurrentScriptLine++;
			wait_scBoxUpdate = true;
			return;
			
		}else{
			wait_scBoxUpdate = true;
		}
		
		//执行其他类型脚本
		switch(script.type){
			case "LINE_CMD":{
				var cmd = typeof script.content == "string" ? script.content : script.content[0];
				self._Tools.execGScript(cmd);
				self.isWait = true;// 等待任何按键
				break;
			}
			case "JS":{
				self._Tools.execJScript(script.content.data);
				break;
			}
		}
		self.CurrentScriptLine++;
	};


	aGL = new Kinetic.Animation(gameLoop);
	aGL.start();

};

//接结束游戏
Reitsuki.prototype.stop = function(){
	this.isStop = true;
};

//运行行内脚本
Reitsuki.prototype._runScript = function(nowScript,ns,kText,eng){
	if(nowScript == undefined){
		return;
	}
	eng._Tools.ExecScriptCMD(nowScript.content,ns,kText);
	
	if(nowScript.type == "INLINE_CMD"){
		//等待一个字符时间
		eng.isWait = true;
		eng.scriptExecer.suspend = true; //挂起脚本框
		
		var self = eng;
		window.setTimeout(function(){
			self.isWait = false;
			eng.scriptExecer.suspend = false; 
		},eng.displaySpeed);
	}
};

Reitsuki.prototype.setCharImg = function (chars,eng){
	if(eng.charactersSetting.filetype == undefined){
		return;
	}
	for(var i = 0,l=chars.length; i<l; i++){
		var dispChar = chars[i];
		var charName = dispChar.name;
		var imgNum = dispChar.no;

		if(eng.charactersSetting[charName] == undefined){
			eng.CH.children = [];
			eng.CH.clear();
			eng.CH.draw();
			continue;
		}

		var imgName = imgNum != "0" ? eng.charactersSetting[charName] + "-" + imgNum + "." + eng.charactersSetting.filetype
			: eng.charactersSetting[charName] +"."+ eng.charactersSetting.filetype;

		var imgObj = new Image();
		imgObj.src = "character/" + imgName;
		imgObj.onload = function(){
			var kImg = new Kinetic.Image({
				width:imgObj.width,
				height:imgObj.height,
				image:imgObj ,
				y:eng.stage.getHeight() - imgObj.height,
				x: eng.stage.getWidth() / 2 - imgObj.width /2
			});

			eng.CH.add(kImg);
			eng.CH.draw();
		};
	}
}

// 脚本命令处理工具空间
Reitsuki.prototype._Tools = {};


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
	paramObject.o = null;
	for(var i=0,l=tmpArr.length; i < l; i++){
		var kv = tmpArr[i].split(":");
		if($.trim(kv[0]) == ""){
			continue;
		}
		if(i == 0){
			funcName = kv[0];
			if(kv.length == 2){
				paramObject.o = kv[1];
			}else{
				paramObject[kv[0]] = kv[1];
			}
		}else{
			paramObject[kv[0]] = kv[1];
		}
	}
	
	if(funcName != "" && this._rei.Global[funcName] != undefined){
		this._rei.Global[funcName](paramObject);
	}
};

Reitsuki.prototype._Tools.ExecScriptCMD = function(str,ns,kText){
	var funcName = str.substr(0,str.indexOf(":"));
	var pArr = str.split(" ");
	if(funcName[0] != "@"){
		this.execGScript(str,ns,kText);
	}else{
		this.callFunction(str,ns,kText)
	}
};

//------ 脚本预设函数 --//
Reitsuki.prototype.InitScriptFuncs = function(){
	var g = this.Global;
	var eng = this;
	//设置标题
	g.title = function(o){
		window.document.title = o.o;
	};
	
	//设置背景
	g.bg = function(o){
		var imageObj = new Image();
		imageObj.src = "bg/" + o.o + ".jpg";
		imageObj.onload = function(){
			eng.BK.children = [];
			var self = this;
			var img = new Kinetic.Image({
				image:self,
				x:0,
				y:0
			});
			eng.BK.add(img);
			eng.BK.draw();
		};
	};

	//改变背景颜色
	g.bgcolor = function(o){	
		console.log("Run");
		var rect = new Kinetic.Rect({
				x:0,
				y:0,
				width:eng.width,
				height:eng.height,
				fill:o.o,
				opacity:1
			});
		if(o.speed == undefined){
			//无渐变
			eng.BK.children = [];
			eng.BK.add(rect);
			eng.BK.draw();
		}else{
			eng.isWait = true;
			var speed = o.speed;
			var chBgc;
			var sTime = new Date().getTime();
			var etime; 
			var nOpacity = 0;
			var addOp = 1 / speed;
			eng.BK.add(rect);
			chBgc = new Kinetic.Animation(function(f){
				var time = (new Date().getTime()) - sTime;
				if(time < speed){
					return;
				}
				if(nOpacity >= 1){
					eng.BK.children = [rect];
					rect.setOpacity(1);
					eng.BK.draw();
					chBgc.stop();
					return;
				}
				if(time > addOp){
					nOpacity += addOp + (1/(time-addOp));
				}else{
					nOpacity += addOp;
				}
				rect.setOpacity(nOpacity);
				eng.BK.draw();
			});
			chBgc.start();
		}
	};
	
	//播放背景音乐
	g.bgm = function(o){
		eng.NowBGM.loop = true;
		eng.NowBGM.src = 'bgm/' + o.o + ".ogg";
		eng.NowBGM.preload = "auto";
		if(eng.NowBGM.currentTime != 0){
			eng.NowBGM.currentTime = 0;
		}
		eng.NowBGM.play();
	};
	
	//段落清屏
	g.blockEnd = function(o){
		eng.scriptExecer.resetALL();
	};
	
};
//------ 脚本预设函数:end --//


//剧本Parser
Reitsuki.prototype.Parser = function scriptParser(scriptContent){
	//脚本预处理
	scriptContent = $.trim(scriptContent);
	//scriptContent = $.trim(scriptContent.replace(/^\r?\n/mg,("[blockEnd]\r\n")));
	
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
			var index = scriptTree.length > 0 ? scriptTree.length: 0;
			if(trimLine == '\\'){
				if(scriptTree[index] != undefined){
					scriptTree[index] += '\r\n';
				}
			}else{
				if(scriptTree[index] != undefined){
				scriptTree[index] += '\r\n' + line;
				}else{
					scriptTree.push(line);
				}
			}
			
			scriptTree[index] = $.trim(scriptTree[scriptTree.length-1]);
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
					i += (text.indexOf(endSym) + endSym.length-1) ;
					
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
		
		if(line.content.length == 0){
			var pIndex = scriptNodeList.length - 1;
			if(scriptNodeList[pIndex].type == "LINE" ){
				//如果是段落末尾的空行的话 就替换成清屏命令
				line.type = "LINE_CMD";
				line.content.push("blockEnd");
			}
		}
		
		if(line.content.length != 0 || typeof line.content == "string"){
			scriptNodeList.push(line);
		}
	});
	return scriptNodeList;
};