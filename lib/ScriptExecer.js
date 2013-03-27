//
function ScriptExecer(contents,layout,displaySpeed,textSetting,runScriptCallback,characterCallback,eng){
	this.layout = layout;
	this.contents = contents;
	this.runScriptCallback = runScriptCallback;
	this.characterCallback = characterCallback;
	this.displaySpeed = displaySpeed;
	this.ns = {}; //存放临时变量空间,当clear方法执行后被清空
	this.eng = (eng == undefined) ? {}:eng; //指向引擎的引用
	
	this.group = new Kinetic.Group(); //创建用来存放脚本框的组
	//初始化剧本框显示文字对象
	this.kText = new Kinetic.Text(textSetting);
	this.group.add(this.kText);
	this.layout.add(this.group);
	
	this.lineHeightPx = this.kText.getLineHeight() * this.kText.getTextHeight(); //一行的高度
	this.canDispLineCount = Math.floor(this.kText.getHeight() / this.lineHeightPx); //能容纳多少行
	this.lineDispCharCount = Math.floor(this.kText.getWidth() / this.kText.getFontSize())-1 ; //一行能容纳多少个字	
	
	this.contentIndex = 0;
	this.suspend = false; //是否被挂起
	this.displayComplete = false;
	this.complete = false;
	this._oldContentIndex = -1;
}

ScriptExecer.prototype.update = function(){
	if(this.contents == undefined || this.contentIndex > this.contents.length || this.suspend){
		if(!this.suspend){
			this.complete = true;
		}
		return;
	}
	
	var nowScript = this.contents[this.contentIndex]; //当前脚本行
	if(typeof nowScript == "string"){
		if(this._oldContentIndex != this.contentIndex){
			// 获得该行脚本角色立绘信息
			var characters = this.characterImgParser(nowScript);
			if(characters.length > 0){
				if(typeof this.characterCallback == "function"){
					this.characterCallback(characters,this.eng);
				}

				//名字不使用打字效果
				var characterName = nowScript.substr(0,nowScript.indexOf(":")+1);
				this.ns.dispText = characterName.replace(/\(\S+?\)/,"");
				this.ns.lineIndex = 0;
				this.ns.inLineIndex = characterName.length;
				this.ns.jumpName = true;
			}else{
				this.ns.jumpName = false;
			}
			
			this._oldContentIndex  = this.contentIndex;
		}
	
		this.drawScriptBox(nowScript); //绘制脚本框的内容
		if(this.displayComplete){
			this.ns.lineIndex = 0;
			this.ns.inLineIndex = 0;
			this.displayComplete  = false;
		}
	}else{
		if(typeof this.runScriptCallback == "function" ){
			this.runScriptCallback(nowScript, this.ns,this.kText,this.eng);
		}
		this.contentIndex++;
	}
	
}

//绘制脚本框的内容
ScriptExecer.prototype.drawScriptBox = function(str){
	//是否完成输出文字
	this.displayComplete = (this.displayComplete == undefined) ? false:this.displayComplete;
	
	//根据脚本框的大小分行
	if ( this.ns._oldText != str || this.ns.lines === undefined){
		this.ns._oldText = str;
		this.ns.lines = [];
		var lines = this.ns.lines;
		var line = [];

		for(var i = 0, l = str.length; i < l;i++){
			var ch = str[i];
			if(ch == '\n'){
				line.push(ch);
				var lineStr = line.join('');
				line = [];
				lines.push(lineStr);
			}
			
			if(line.length < this.lineDispCharCount ){
				line.push(ch)
			}else{
				var lineStr = $.trim(line.join(''));
				line = [];
				lines.push(lineStr);
			}
		}
		lines.push($.trim(line.join(''))); //压入最后一行	
	}
	
	if(this.ns.sTime == undefined){
		//this.ns.nowTime = new Date().getTime();
		this.ns.sTime = new Date().getTime();
		this.ns.screenLineCount = 0;
		this.ns.wait = false;
		this.ns.needClear = false;
		
		if(!this.ns.jumpName){
			this.ns.dispText = "";
			this.ns.inLineIndex = 0;
			this.ns.lineIndex = 0;
		}
	}
	
	if(new Date().getTime() - this.ns.sTime > this.displaySpeed){
		//** 相隔 displaySpeed 秒 **/
		if(!this.ns.wait){
			//清屏
			if(this.ns.needClear ){
				this.clearScriptBox();
				this.ns.needClear = false;
			}
		
			if(this.ns.lineIndex < this.ns.lines.length){
				var line = this.ns.lines[this.ns.lineIndex] + "\r\n";
				if(this.ns.screenLineCount < this.canDispLineCount){
					//打字机方式输出每个字
					if(this.ns.inLineIndex < line.length){
						this.ns.dispText += line[this.ns.inLineIndex];
						this.ns.inLineIndex++;
						//到行尾等待任何按键再继续
						if(this.ns.inLineIndex == line.length){
							this.ns.wait = true;
						}
					}else{
						//换行
						this.ns.inLineIndex = 0;
						this.ns.lineIndex++;
						this.ns.screenLineCount++;
					}

					this.kText.setText(this.ns.dispText);
					this.layout.clear();
					this.layout.draw();
				}else{
					 //清屏
					this.ns.needClear = true;
				}
			}else{
				this.displayComplete = true;
				this.contentIndex++;
			}
		} //判断是否要等待一些动作
		
		this.ns.sTime = new Date().getTime(); //新的开始时间
	}
	
};

//直接显示一行
ScriptExecer.prototype.displayLine = function(){
	if(this.complete){
		return;
	}
	
	this.update();
	var line = this.ns.lines[this.ns.lineIndex]+ "\r\n";
	this.ns.dispText += line.substring(this.ns.inLineIndex);
	this.ns.lineIndex++;
	this.ns.inLineIndex = 0;
	
	//判断是否要清屏
	if(this.ns.screenLineCount > this.canDispLineCount){
		this.clearScriptBox(); 
	}
	this.ns.screenLineCount++;
	
	this.kText.setText(this.ns.dispText);
	this.layout.clear();
	this.layout.draw();	
	
};

//清理脚本框的内容
ScriptExecer.prototype.clearScriptBox = function(){
	this.kText.setText("");
	this.layout.clear();
	this.layout.draw();
	
	if(this.ns.dispText != undefined){
		this.ns.dispText = "";
	}
	if(this.ns.screenLineCount != undefined){
		this.ns.screenLineCount = 0;
	}
};
ScriptExecer.prototype.characterImgParser = function(str){
	var result = [];
	if(str.indexOf(":") == -1)
		return result;
	
	var charsText = str.substr(0,str.indexOf(":"));
	var characters = charsText.split(","); //容许以','分隔使用多个立绘
	for(var i = 0,l = characters.length; i< l;i++){
		var character = characters[i];
		var m = character.match(/(\S+?)\((\S+?)\)/)
		if(m){
			var ch = {name: m[1],no:m[2]};
			result.push(ch);
		}else{
			var ch = {name: character,no:"0"};
			result.push(ch);		
		}
	}
	return result;
}

ScriptExecer.prototype.pressKey = function(){
	if(this.complete)
		return;
	if(this.ns.wait){
		this.ns.wait = false;
	}else{
		this.displayLine();
	}
};

//重置全部
ScriptExecer.prototype.resetALL = function(){
	this.ns = {};
	this.contents = [];
	this.clearScriptBox();
	this.displayComplete = false;
	this.suspend = false;
	this.contentIndex = 0;
	this.complete = false;
	this._oldContentIndex = -1;
	this.eng.CH.children = [];
	this.eng.CH.clear();
	this.eng.CH.draw();
};

//重置,但不重置当前显示的内容(不换行不换屏)
ScriptExecer.prototype.reset = function(){
	this.ns.lineIndex = 0;
	this.ns.lineIndex = 0;
	this.contents = [];
	this.displayComplete = false;
	this.suspend = false;
	this.contentIndex = 0;
	this.complete = false;
	this._oldContentIndex = -1;
};
ScriptExecer.prototype.setContents = function(contents){
	this.reset();
	this._oldContentIndex = -1;
	this.contents = contents;
};