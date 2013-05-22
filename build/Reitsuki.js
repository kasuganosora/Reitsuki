/* Build Time: 2013-05-21 20:38:47 */
/**
 * @author sorakasugano
 */

var Reitsuki = {};
/**
 * Created with JetBrains WebStorm.
 * User: sorakasugano
 * Date: 13-4-15
 * Time: 下午8:16
 * To change this template use File | Settings | File Templates.
 */
/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            //if ( !initializing && this.init )
            if (  !initializing && this.init ){
                this.init.apply(this, arguments);
            }

        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();


function typeofEX(obj){
    return Object.prototype.toString.call(obj).slice(8,-1).toLowerCase();
}

stringHash = function (str,caseSensitive){
    if(!caseSensitive){
        str = str.toLowerCase();
    }
    // 1315423911=b'1001110011001111100011010100111'
    var hash  =   1315423911,i,ch;
    for (i = str.length - 1; i >= 0; i--) {
        ch = str.charCodeAt(i);
        hash ^= ((hash << 5) + ch + (hash >> 2));
    }

    return  (hash & 0x7FFFFFFF);
};
/**
 * Created with JetBrains WebStorm.
 * User: sorakasugano
 * Date: 13-4-10
 * Time: 下午3:35
 * Reitsuki Galgame MessageCenter
 */

/**
 * 信息中心,用来分发和调度来至脚本执行器的命令到各个组件上执行
 * @param {Kinetic.Stage}dev Kinentic.Stage 舞台对象
 * @constructor
 */
function MessageCenter(dev){
    this.components = {};
    this.scriptManager = null;
    this.dev = dev;
    this.cmds = [];
    this.nowRunningCompName = "";
}

MessageCenter.prototype.update = function(){
    if(this.cmds.length === 0){
       this._getScriptCMDS();
    }

    if(this.cmds.length === 0){
        this.nowRunningCompName = "";
        return;
    }

    if(this.nowRunningCompName === ""){
        this._nextCMDSendComponentExec();
    }

    var runningComp = this.components[this.nowRunningCompName];
    if(runningComp.update() == "COMPLETE"){
        //组件运行完成
        runningComp.reset();
        this.cmds.shift(); // 移除已经完成的命令
        this._nextCMDSendComponentExec();//把下一条命令发送给组件运行
    }

};
MessageCenter.prototype.shiftRUN = function(cmd){
    this.cmds.unshift(cmd);
    this._nextCMDSendComponentExec();

};

MessageCenter.prototype.registerscriptManager = function(scriptManager){
    this.scriptManager =  scriptManager;
};

MessageCenter.prototype.registerComponent = function(component){
    if(this.components[component.name.toLowerCase()] === undefined){
        this.components[component.name.toLowerCase()] = component;
        component.messageCenter = this;
        component.dev = this.dev;
    }

};

MessageCenter.prototype.getComponent =  function(componentName){
    if(this.components[componentName.toLowerCase()] !== undefined){
       return this.components[componentName.toLowerCase()];
    }

};

MessageCenter.prototype.broadcast = function (message,prama){
     if(prama === null || prama === undefined){
         prama = {};
     }
    for(var compName in this.components){
        var comp = this.components[compName];
        if(typeof comp["_B_" + message.toUpperCase()] == "function"){
            prama.dev = this.dev;
            prama.messageCenter = this;
            comp["_B_" + message.toUpperCase()](prama);
        }
    }
};

MessageCenter.prototype._getScriptCMDS = function(){
    this.cmds = this.scriptManager.getNextScripts();
};


MessageCenter.prototype._nextCMDSendComponentExec = function(){
    if(this.cmds.length === 0){
        this.nowRunningCompName = "";
        return;
    }
    var cmd = this.cmds[0];

    if(this.components[cmd.componentName.toLowerCase()] === undefined){
        console.log("命令:"+ cmd.methodName + "依赖的组件:" + cmd.componentName + "不存在");
        return;
    }

    cmd.param.dev = this.dev;
    cmd.param.messageCenter = this;
    this.nowRunningCompName = cmd.componentName.toLowerCase();
    this.components[cmd.componentName.toLowerCase()].exec(cmd); // 执行
};

/**
 * Created with JetBrains WebStorm.
 * User: sorakasugano
 * Date: 13-4-12
 * Time: 上午10:56
 * retsuki.tool.js
 */

var ComponeBase = Class.extend({
    /**
     * 组件的基类
     * @constructor
     */
    init:function(){
        this.hasError = false;
        this.name = "componeBase";
        /**
         *  Update need Contents;
         * @type {Object}
         */
        this.content = {};
        this.cmd = null;
        this.messageCenter = null;
        this.dev = null;
    },
    COMPLETE_FLAG:"COMPLETE",

    update:function(){
        var COMPLETE_FLAG = this.COMPLETE_FLAG;
        if(this.cmd === null){
            this.reset();
            return COMPLETE_FLAG;
        }

        var cmd = this.cmd;
        if(!this.hasMethod(cmd.methodName)){
            console.log("组件:" + this.name + " 不支持方法:"+ cmd.methodName);
            this.reset();
            return COMPLETE_FLAG;
        }


        if( this[cmd.methodName](cmd.param) == this.COMPLETE_FLAG){
            this.reset();
            return COMPLETE_FLAG;
        }
    },
    reset:function(){
        this.cmd = null;
        this.content = {};
        this.hasError = false;
    },
    exec:function(cmd) {
        this.reset();
        this.cmd = cmd;
    },
    hasMethod:function(methodName){
        if(this[methodName] !== undefined && typeof this[methodName] == "function"){
            return true;
        }else{
            return false;
        }
    }

});


/**
 * @author sorakasugano
 * 背景组件
 */

var BGComponent = ComponeBase.extend({
    init:function(dev){
        this._super(); //初始化基类

        this.dev = dev;
        this.layer = new Kinetic.Layer({
            width:dev.getWidth(),
            height:dev.getHeight(),
            x:0,
            y:0
        });
       // this.layer.setZIndex(this.zIndex);
        this.dev.add(this.layer);
        this.BGDir = "bg";
        this.BGFileType = "jpg";
        this.name = "BGComponent"; //组件名称
    },

    _B_setBGDIR:function(o){
        this.BGDir = o;
    },
    _B_setBGFileType:function(o){
        this.BGFileType = o;
    },

    setBG:function(o){
        var self = this;
        if(this.content.BgImage !== undefined){
            o.imgObj = this.content.BgImage ;
            if(o.speed || o.mode){
              return  self._setBGEX(o);
            }else{
              return  self._setBG(o);
            }
        }

        if(!this.content.loadedImg){
            var bgImgPath = this.BGDir + "/" + o.img + "." + this.BGFileType;
            var imageObj = new Image();
            imageObj.onload = function(){
                self.content.BgImage = this;
                self.content.loadedImg = true;
            };
            imageObj.src = bgImgPath;
        }


    },
    _setBG:function(o){
       this.layer.clear();
       this.layer.children = [];
       // this.layer.removeChildren();
       var bgObj = new Kinetic.Image({
           x:0,
           y:0,
           image: o.imgObj,
           width:this.dev.getWidth(),
           height:this.dev.getHeight()
       });
       this.layer.add(bgObj);
       this.layer.draw();
        return this.COMPLETE_FLAG;
    },
    /**
     * 带渐变效果的设置背景图
     * @param {Number}o.speed
     * @param {Kinetic.Image} o.imgObj
     * @private
     */
    _setBGEX:function(o){
       //初始化渐变动画
       if(this.content.start === undefined){
           this.content.start = true;
           this.content.timestampA = (new Date()).getTime();

           if(this.layer.children.length > 0){
               this.layer.children[0].setZIndex(0);
           }

           this.content.kImgObj = new Kinetic.Image({
               x:0,
               y:0,
               image: o.imgObj,
               width:this.dev.getWidth(),
               height:this.dev.getHeight(),
               opacity:0
           });
           this.layer.add(this.content.kImgObj);
           this.content.opacityChangeCount = 1 / o.speed;
       }


       //渐变动画
        var pastTime = (new Date()).getTime() - this.content.timestampA;

       if(pastTime < 1){
           return;
       }
       var opacity = pastTime * this.content.opacityChangeCount;
        if(opacity > 1){
            opacity = 1;
            if(this.layer.children.length > 0){
                this.layer.children = [this.content.kImgObj];
            }
        }
        this.content.kImgObj.setOpacity(opacity);
        this.layer.clear();
        this.layer.draw();
        if(opacity === 1){
           return this.COMPLETE_FLAG;// 动画完成
        }
    },

    setBGColor:function(o){
        if(o.speed){
           return this._setBGColorEx(o);
        }else{
           return this._setBGColor(o);
        }
    },
    _setBGColor:function(o){
        this.layer.clear();
        this.layer.children = [];
        var bg = new Kinetic.Rect({
            x:0,
            y:0,
            width:this.dev.getWidth(),
            height:this.dev.getHeight(),
            fill: o.color
        });
        this.layer.add(bg);
        this.layer.draw();
        window.aa = this.layer;
        return this.COMPLETE_FLAG;
    },
    _setBGColorEx:function(o){

        //初始化渐变动画
        if(this.content.start === undefined){
            this.content.start = true;
            this.content.timestampA = (new Date()).getTime();

            if(this.layer.children.length > 0){
                this.layer.children[0].setZIndex(0);
            }

            this.content.rectObj = new Kinetic.Rect({
                x:0,
                y:0,
                fill: o.color,
                width:this.dev.getWidth(),
                height:this.dev.getHeight(),
                opacity:0
            });
            this.layer.add(this.content.rectObj);
            this.content.opacityChangeCount = 1 / o.speed;
        }
        //渐变动画
        var pastTime = (new Date()).getTime() - this.content.timestampA ;
        if(pastTime < 1){
            return;
        }
        var opacity = pastTime * this.content.opacityChangeCount;
        if(opacity > 1){
            opacity = 1;
            if(this.layer.children.length > 0){
                this.layer.children = [this.content.rectObj];
            }
        }

        this.content.rectObj.setOpacity(opacity);
        this.layer.clear();
        this.layer.draw();
        if(opacity === 1){
            return this.COMPLETE_FLAG;// 动画完成
        }
    }
});
/**
 * @author sorakasugano
 * 角色组件
 */

var CHComponent = ComponeBase.extend({
    init:function(dev,charTable){
        this._super();
        this.name = "CHComponent";
        this.CHDir = "character";
        this.CHFileType = "png";
        this.dev = dev;
        this.charTable = charTable;
        this.loadedCHImg = {};//已经加载过的角色图片 this.loadedCHImg["角色名"]["编号"]
        this.nowDisplayCH = {};//正在显示的角色立绘

        this.layer =  new Kinetic.Layer({
            width:dev.getWidth(),
            height:dev.getHeight(),
            x:0,
            y:0
        });
        this.chGroup = new Kinetic.Group({
            width:dev.getWidth(),
            height:dev.getHeight(),
            x:0,
            y:0
        });
        this.layer.add(this.chGroup);
        this.dev.add(this.layer);
    },

    setCharacter:function(o){
       if(typeofEX(o.character) == "array"){
           //显示多个立绘
           return this._setCharacters(o);
       }else{
           //只显示单个立绘
           var chars = [];
           chars.push(
               {
                   charName: o.character.charName,
                   charNum: o.character.charNum,
                   noDisplay: o.character.noDisplay ? true:false
               }
           );
           o.character = chars;
           return this._setCharacters(o);
       }
    },

    clearCharacter:function(){
        this.nowDisplayCH = {};
        this.chGroup.removeChildren();
        this.layer.clear();
        return this.COMPLETE_FLAG;
    },

    removeCharacter:function(o){
        if(!o.name || !this.nowDisplayCH[o.name]){
            return this.COMPLETE_FLAG;
        }
        delete this.nowDisplayCH[o.name];
        this._drawCH();
        return this.COMPLETE_FLAG;
    },

    _setCharacters:function(o){
        var charCount =  o.character.length;
        var i;
        var character;
        if(this.content.init === undefined){
            if(this.content.nowDisplayCount === undefined){
                this.content.nowDisplayCount = 0;
            }

            for( i = 0; i < charCount; i++ ){
                 character = o.character[i];
                if(character.noDisplay === true){
                    continue;
                }
                if(this._loadImg(character.charName,character.charNum) !== null){
                    this.content.nowDisplayCount++;
                }
            }

            this.nowDisplayCH = {};
            this.content.init = false; //全部图片加入装载队列
        }

        //检查图片是否装载完毕

        if(this.content.init === false){
            var loadedImgCount = 0;
            for( i = 0; i < charCount; i++ ){
                 character = o.character[i];

                if(!this.loadedCHImg[character.charName] || this.loadedCHImg[character.charName][character.charNum] === undefined) {
                    continue;
                }

                //把已经载入的图像放到现在显示立绘中
                if(
                    this.nowDisplayCH[character.charName] === undefined &&
                    this.loadedCHImg[character.charName][character.charNum] !== null
                    ){
                    this.nowDisplayCH[character.charName] = this.loadedCHImg[character.charName][character.charNum];
                }
                loadedImgCount++;
            }
            if(loadedImgCount == this.content.nowDisplayCount){
                this.content.init = true;//代表全部图片加载成功(去掉了加载失败的图片);
            }
        }

        //显示立绘
        if(this.content.init === true){
            this._drawCH();
            return this.COMPLETE_FLAG;
        }
    },

    _drawCH:function(){
        this.chGroup.children = [];
        for(var charName in this.nowDisplayCH){
            if(this.nowDisplayCH.hasOwnProperty(charName)){
                var imgObj = this.nowDisplayCH[charName];
                this._pushImgToGroup(imgObj);
            }
        }
        this._resetCharacterPos(); //设置立绘的显示位置
        this.layer.clear();
        this.layer.draw();  //绘制立绘
    },
    /**
     * 调整立绘显示的位置
     * @private
     */
    _resetCharacterPos:function(){
        var groupWidth = 0;
        var maxCHHight = 0;
        var kImg;
        var i,l;
        for( i= 0,l= this.chGroup.children.length; i<l; i++){
             kImg = this.chGroup.children[i];
            groupWidth += kImg.getWidth();
            if(maxCHHight < kImg.getHeight()){
                maxCHHight = kImg.getHeight();
            }
        }
        this.chGroup.setWidth(groupWidth);
        this.chGroup.setY(this.dev.getHeight() - maxCHHight);
        var gX = this.dev.getWidth() / 2 - groupWidth /2;
        this.chGroup.setX(gX);
        this.chGroup.setHeight(maxCHHight);


        //设定每个立绘的相对X
        var nextCHOffsetX = 0;
        for( i= 0,l= this.chGroup.children.length; i<l; i++){
             kImg = this.chGroup.children[i];
             kImg.setX(nextCHOffsetX);
             kImg.setY(this.chGroup.getHeight() - kImg.getHeight());
             nextCHOffsetX += kImg.getWidth();
        }
    },

    _pushImgToGroup:function(imgObject){
        var kCHImg = new Kinetic.Image({
            image: imgObject,
            width:imgObject.width,
            height:imgObject.height,
            opacity:1
        });
        this.chGroup.add(kCHImg);
    },

    _loadImg:function(charName,charNum){
       var self = this;
       var imgObj = new Image();
       var imgUrl = this._queryCHImgFileName(charName,charNum);

        if(imgUrl === null){
            return null;
        }
        imgObj.onload = function(){
            if(!self.loadedCHImg[charName]){
                self.loadedCHImg[charName] = {};
            }
            self.loadedCHImg[charName][charNum] = this;
        };
        imgObj.onerror = function(){
            self.loadedCHImg[charName][charNum]  = null;
            console.log("Character Image:"+ charName + "("+ charNum +")"+" load fail");
        };
        imgObj.src = imgUrl;

        return true;
    },

    _queryCHImgFileName:function(charName,charNum){

        if(this.charTable === undefined){
            throw new Error("need set charTable for CHComponent");
        }

        if(this.charTable[charName] === undefined || this.charTable[charName][charNum] === undefined){
            return null;
        }
        return this.CHDir + "/" + this.charTable[charName][charNum] + "." + this.CHFileType;
    }
});
/**
 * @author sorakasugano
 */

var DialogComponent = ComponeBase.extend({
    init:function(){
        this._super();
        this.name = "DialogComponent";
        this.zIndex = 1000;
        this.nowDisplayDailog = null;
    },

    show:function(o){
        var id = o.id;
        var callback = o.callback;
        var content = this.content;

        //收到载入进度消息,直接关闭对话框
        if(content.intLoadEvent){
            content.intLoadEvent = false;
            return this.COMPLETE_FLAG;
        }

        if(content.init === undefined){
            if(this.nowDisplayDailog != null){
                this.nowDisplayDailog.style.display = "none";

            }

            content.init = true;
            content.dialog = document.getElementById(id);
            this.messageCenter.broadcast("HIDESCRIPTBOX",null);
            content.maskLayer = this._createMaskLayer();
            var mZindex =    Number(content.maskLayer.style.zIndex);
            content.dialog.style.zIndex = mZindex+ 1;

            content.dialog.style.display = "block"; // show
            content.dialog.style.position = "absolute";

            var dWidth = content.dialog.offsetWidth > this.dev.getWidth() ? this.dev.getWidth() :
                            content.dialog.offsetWidth;

            var dHeight = content.dialog.offsetHeight > this.dev.getHeight() ? this.dev.getHeight() :
                content.dialog.offsetHeight;

            var dX =   this.dev.getContent().offsetLeft + this.dev.getWidth() / 2 - dWidth / 2;
            var dY =    this.dev.getContent().offsetTop + this.dev.getHeight() / 2 - dHeight / 2;

            content.dialog.style.left = dX + "px";
            content.dialog.style.top = dY + "px";

            content.dialog.style.width = dWidth + "px";
            content.dialog.style.height = dHeight + "px";

            this.nowDisplayDailog = content.dialog;

            this.dev.getContent().appendChild(content.maskLayer);
        }

        if(content.result !== undefined){
            if(typeof callback === "function"){
                callback(content.result);
            }
            return this.COMPLETE_FLAG;
        }
    },

    reset:function(){
        if(this.content.maskLayer !== undefined){
            this.content.maskLayer.parentNode.removeChild(this.content.maskLayer);
            this.content.dialog.style.display = "none";
            this.messageCenter.broadcast("SHOWSCRIPTBOX",null);
            this.zIndex -= 2;
            this.nowDisplayDailog = null;
        }
        ComponeBase.prototype.reset.call(this);
    },

    _B_CLOSE_DIALOG:function(result){
       if(this.content.init){
           this.content.result = result;
       }
    },

    _B_LOADEVENT:function(){
        this.content.intLoadEvent = true;
    },
    _B_QUERY_DISPLAY_DAILOG:function(callback){
         if(typeof callback === "function"){
             callback(this.nowDisplayDailog);
         }
    },
    _createMaskLayer:function(){
        this.zIndex += 2;
        var maskLayer = document.createElement("div");
        maskLayer.style.backgroundColor = "#000000";
        maskLayer.style.opacity = "0.8";
        maskLayer.style.position = "absolute";
        maskLayer.style.width = this.dev.getWidth() + "px";
        maskLayer.style.height = this.dev.getHeight() + "px";

        maskLayer.style.display = "block";
        maskLayer.style.zIndex = this.zIndex;
        return maskLayer;
    }
});
/**
 * @author sorakasugano
 * TODO 要完成各种属性的 setter getter
 */

var ScriptDispBoxComponent = ComponeBase.extend({
    init:function(o){
        this._super();
        this.name = "ScriptDispBoxComponent";

        if(!o.layer){
            throw new ReferenceError("param layer is not set");
        }
        this.layer = o.layer;


        this.width = o.width ? o.width : 780;
        this.height = o.height ? o.height : 120;
        this.x = o.x ? o.x : this.layer.getWidth() / 2 - this.width /2;
        this.y = o.y ? o.y : this.layer.getHeight() - this.height - 10;

        this._hidden = o.hidden !== undefined ? o.hidden : false;
        this.bkOpacity = o.bkOpacity ? o.bkOpacity :1;
        this.backgroundType = o.backgroundType ? o.backgroundType.toLowerCase() : "color";
        this.background = null;
        if(!o.background && this.backgroundType == "color"){
            o.background = "#333";
            this.bkOpacity = 0.7;
        }

        if( this.backgroundType != "color" && this.backgroundType !="image") {
            o.backgroundType = "color";
            o.background = "#333";
            this.bkOpacity = 0.7;
        }
        if(o.background){
            this.background = o.background;
        }
        this.backgroundNode = null;



        this.textBoxX = o.textBoxX ? o.textBoxX : 18;
        this.textBoxY = o.textBoxY ? o.textBoxY : 10;
        this.textBoxWidth = o.textBoxWidth ? o.textBoxWidth : this.width - 18 * 2;
        this.textBoxHeight = o.textBoxHeight ? o.textBoxHeight : this.height - 10 *2;


        this.textColor = o.textColor ? o.textColor : "white";
        this.textSize = o.textSize ? o.textSize : 14;
        this.textSpeed = o.textSpeed ? o.textSpeed : 100;
        this.fontFamily = o.fontFamily ? o.fontFamily :"'Microsoft YaHei',Verdana,Helvetica,sans-serif,Arial";

        this._itemGroup = new Kinetic.Group({
            x:this.x,
            y:this.y,
            width:this.width,
            height:this.height
        });
         this.layer.add(this._itemGroup);

        if(this._hidden){
            this._itemGroup.hide();
        }

        this.buttonAreaHeight = o.buttonAreaHeight ? o.buttonAreaHeight : 20;
        this.buttonAreaWidth =  o.buttonAreaWidth ? o.buttonAreaWidth :  this.textBoxWidth;
        this.textBoxHeight -= this.buttonAreaHeight;



        this._textBox = this._createTextBox();
        this._nameBox = this._createNameBox();

        this._initTextBoxAndBackground();
        this.buttonAreaEle = null;
        this.passKey = false;

        this.PASS_ANY_KEY_ICON_ID = "_Game_PassKeyIcon";
        this.BUTTON_AREA_ID = "_Game_gameArea";
        this._initPassAnyKeyIcon();
        this.buttonAreaEle = this._createButtonArea();
    },

    setBackgroundImage:function(backgroundType,bk,bkOpacity){
        this.bkOpacity = bkOpacity === undefined ? 1 :bkOpacity;
        this.backgroundType = backgroundType? backgroundType.toLowerCase() : "color";
        this.background = bk;
        this._itemGroup.children = [];
        this._initTextBoxAndBackground();
    },
    setTextSpeed:function(speed){
        this.textSpeed = speed;
    },
    setWidth:function(width){
        this.width = width;
        this._itemGroup.setWidth(width);
        this._reDraw();
    },
    setHeight:function(height){
        this.height = height;
        this._itemGroup.setHeight(height);
        this._reDraw();
    },
    setPos:function(x,y){
        this.x = x;
        this.y = y;

        this._itemGroup.setX(x);
        this._itemGroup.setY(y);
        this._reDraw();
    },
    setTextSize:function(size){
        this.textSize = size;
        this._textBox.setFontSize(size);
        this._reDraw();
    },
    setTextFontFamily:function(fontFamily){
        this.fontFamily = fontFamily;
        this._textBox.setTextFontFamily(fontFamily);
        this._reDraw();
    },
    setTextColor:function(color){
        this.textColor = color;
        this._textBox.setFill(color);
        this._reDraw();
    },

    setTextBoxPos:function(x,y){
        var ty = y + this.textSize + 5;
        this.textBoxX = x;
        this.textBoxY = y;
        this._textBox.setX(x);
        this._textBox.setY(ty);
        this._nameBox.setY(y);

        this._reDraw();
    },


    _B_INGAME_MOUSE_KEY:function(e){
        if(e.type == "click" && this.content.start){
            this.passKey = true;
        }
    },

    _B_HIDESCRIPTBOX:function(){
       this.hide();
    },

    _B_SHOWSCRIPTBOX:function(){
        this.show();
    },

    _B_LOADEVENT:function(){
        this.content.intLoadEvent = true;
    },

    getGroup:function(){
        return this._itemGroup;
    },

    setText:function(o){
        //收到载入进度消息,直接关闭对话框
        if(this.content.intLoadEvent){
            this.content.intLoadEvent = false;
            return this.COMPLETE_FLAG;
        }

        var scriptText = o.text;
        var text;
        if(this._hidden){
            return;
        }

        if(this.content.start === undefined){
            this.content.start = true;
            this.content.timestampA = (new Date()).getTime();
            this.content.dispTextArr = this._processText(scriptText);
            this.content.dispText =  this.content.dispTextArr.join('');

            this.content.dispIndexInline = 0;
            this.content.textLine = 0;
            this.content.dispLineNum = 1;
            this.content.needClear = false;
            this.content.canDisplayLineCount = this._getDispLineCount();

            this.content.needWait = false;
            this._nameBox.setText("");

            var colonIndex =  this.content.dispTextArr[this.content.textLine].indexOf("：");
            if(this.content.dispIndexInline === 0 && colonIndex >-1){
                text =  this.content.dispTextArr[this.content.textLine].substr(0,colonIndex);
                this.content.dispIndexInline = text.length + 1;
                this._nameBox.setText("【" + text + "】");
            }else{
                this._nameBox.setText("");
            }
        }

        //判断是否结束
        if(this.content.textLine >= this.content.dispTextArr.length  && !this.passKey){
            this._showPassAnyKeyIcon();
            return;
        }
        if(this.content.textLine >= this.content.dispTextArr.length && this.passKey){
            this.passKey = false;
            this._hidePassAnyKeyIcon();
            return this.COMPLETE_FLAG;
        }

        //判断是否需要清屏换页
        if(this.content.dispLineNum >  this.content.canDisplayLineCount && !this.passKey){
            this._showPassAnyKeyIcon();
            return;
        }
        if(this.content.dispLineNum >  this.content.canDisplayLineCount && this.passKey){
            this.passKey = false;
            this._hidePassAnyKeyIcon();
            this._textBox.setText("");
            this.content.dispLineNum = 1;
        }

        //设置显示字符串的行号和行内索引
        if(this.content.dispIndexInline > this.content.dispTextArr[this.content.textLine].length -1){
            if( (this.content.textLine + 1 >= this.content.dispTextArr.length)){
                this.content.textLine++;
                return;
            }
            this.content.textLine++;
            this.content.dispIndexInline = 0;
            this.content.dispLineNum++;
        }

        //因为按下了任何键后,导致直接显示完一行
        if(this.passKey){
           this.passKey = false;
           text = this._textBox.getText() + this.content.dispTextArr[this.content.textLine]
                    .substr(this.content.dispIndexInline);
           this._textBox.setText(text);
           this.content.dispIndexInline = 0;
           this.content.textLine++;
           this.content.dispLineNum++;
           this._reDraw();
           return;
        }

        //正常状态下的打字式显示
        if(
             this.content.dispTextArr[this.content.textLine][this.content.dispIndexInline] == "\r"  ||
             this.content.dispTextArr[this.content.textLine][this.content.dispIndexInline]  == "\n" ||
             ((new Date()).getTime() - this.content.timestampA)  > this.textSpeed
            ){
            this.content.timestampA = (new Date()).getTime();
            if(this.content.needWait && this.passKey){
                this.passKey = false;
                this.content.needWait = false;
                this._hidePassAnyKeyIcon();
            }


            text = this._textBox.getText() +
                this.content.dispTextArr[this.content.textLine][this.content.dispIndexInline];

            this.content.dispIndexInline++;
            this._textBox.setText(text);
            this._reDraw();

        }
    },

    jitter:function(){
        var jitterSpeed = 100;
        var jitterCount = 3;
        var jitterAmpNum = 0.02;

        if(!this.content.init){
            this.content.init = true;
            this.content.jitteredCount = 0;
            this.content.timestampA = (new Date()).getTime();
            this.content.direction =  "L";
            this.content.jitterAmp = Math.floor(this.backgroundNode.getWidth() * jitterAmpNum);
        }


        if( ((new Date()).getTime() - this.content.timestampA) > jitterSpeed){
            this.content.timestampA = (new Date()).getTime();
            this.content.jitteredCount++;
            if(this.content.direction == "L"){
                this.content.direction = "R";
                this.getGroup().setX(this.x - this.content.jitterAmp);
                this._reDraw();
            }else{
                this.content.direction = "L";
                this.getGroup().setX(this.x + this.content.jitterAmp);
                this._reDraw();
            }
            this._retSetPassAnyKeyImgPos();
        }

        if(this.content.jitteredCount > jitterCount){
            this.getGroup().setX(this.x);
            this._reDraw();
            return this.COMPLETE_FLAG;
        }
    },

    clear:function(){
        this._textBox.setText("");
        this._reDraw();
        return this.COMPLETE_FLAG;
    },

    show:function(){
        this._itemGroup.show();
        this._hidden = false;
        this.buttonAreaEle.style.display = "block";
        this._reDraw();
        return this.COMPLETE_FLAG;
    },
    hide:function(){
        this._itemGroup.hide();
        this._hidden = true;
        this.buttonAreaEle.style.display = "none";
        if(this._passKeyImg){
            this._passKeyImg.style.display = "none";
        }

        this._reDraw();
        return this.COMPLETE_FLAG;
    },

    reset:function(){
        ComponeBase.prototype.reset.call(this);
        this.clear();
    },
    _initTextBoxAndBackground:function(){
        var self = this;
        if(this.backgroundType == "color"){
           this.backgroundNode = new Kinetic.Rect({
               x:0,
               y:0,
               width:this.width,
               height:this.height,
               fill:this.background,
               opacity:this.bkOpacity
           });

            this._itemGroup.add(this.backgroundNode);
            this._itemGroup.add(this._textBox);
            this._itemGroup.add(this._nameBox);
            this._reDraw();
        }else{
            var imgObj = new Image();
            imgObj.onload = function(){
                self.backgroundNode = new Kinetic.Image({
                    image:this,
                    x:0,
                    y:0,
                    width:self.width,
                    height:self.height,
                    opacity:self.bkOpacity
                });
                self._itemGroup.add(self.backgroundNode);
                self._itemGroup.add(self._textBox);
                self._itemGroup.add(self._nameBox);
                self._reDraw();
            };
            imgObj.onerror = function(){
                self.backgroundType = "color";
                self.background = "width";
                self._initTextBoxAndBackground();

            };

            imgObj.src = this.background;
        }
    },

    _createTextBox:function(){
         return  new Kinetic.Text({
             x:this.textBoxX,
             y:this.textBoxY + this.textSize + 5,
             width:this.textBoxWidth,
             height:this.textBoxHeight - this.textSize - 5,
             fontSize:this.textSize,
             fontFamily:this.fontFamily,
             fill:this.textColor,
             text:""
         });

    },

    _createNameBox:function(){
        return  new Kinetic.Text({
            x:this.textBoxX,
            y:this.textBoxY,
            height:this.textSize + 2,
            fontSize:this.textSize,
            fontFamily:this.fontFamily,
            fill:this.textColor,
            text:""
        });
    },
    _createButtonArea:function(){
        var ele = document.getElementById(this.BUTTON_AREA_ID);
        if(ele !== null){
            return ele;
        }
        var baseX = this.getGroup().getLayer().getCanvas().element.offsetLeft + this.x;
        var baseY = this.getGroup().getLayer().getCanvas().element.offsetTop + this.y;

        ele = document.createElement("div");
        ele.style.position = "absolute";
        ele.style.left =  baseX + this.textBoxX + "px";
        ele.style.top = baseY + this.height - this.buttonAreaHeight - 5 + "px" ;
        ele.style.width = this.buttonAreaWidth + "px";
        ele.style.height = this.buttonAreaHeight + "px";
        ele.style.overflow = "hidden";
        ele.id = this.BUTTON_AREA_ID;
        this.layer.getCanvas().element.parentNode.appendChild(ele);
        return ele;
    },
    /**
     * 一行能容纳多少个字
     * @returns {number}
     * @private
     */
    _getDispLintLineLength:function(){
        return Math.floor(this._textBox.getWidth() / this._textBox.getFontSize()) - 1 ;
    },

    /**
     * 一共能显示多少行
     * @returns {number}
     * @private
     */
    _getDispLineCount:function(){
        return Math.floor(this._textBox.getHeight() / (this._textBox.getLineHeight() * this._textBox.getTextHeight()) );
    },

    /**
     * 一共能显示多少字
     * @returns {number}
     * @private
     */
    _getTextBoxDispLengt:function(){
        return this._getDispLintLineLength * this._getDispLineCount;
    },

    /**
     * 重绘
     * @private
     */
    _reDraw:function(){
        var layer = this.layer;
        layer.clear();
        layer.draw();
    },

    /**
     * pt转px
     * @param pt
     * @returns {number}
     * @private
     */
    _ptTopx:function(pt){
        var testNode = document.createElement("div");
        testNode.style.cssText = "width:1in;height:1in;visible:_hidden;padding:0px;margin:0px";
        document.body.appendChild(testNode);
        var result =  pt * testNode.offsetWidth / 72;
        testNode.parentNode.removeChild(testNode);
        return result;
    },

    /**
     * 预处理文本
     * @param text
     * @returns {Array}
     * @private
     */
    _processText:function(text){
        var lineArr = [];
        var boxLineDispLength = this._getDispLintLineLength();
        var rawTextArr = text.split("\n");
        var rline = 0;
        while(rline < rawTextArr.length){
            var line = rawTextArr[rline];
            line = line.replace(/^\s+|\s+$/g, '');

            while(line.length > boxLineDispLength){
                text = line.substr(0,boxLineDispLength-2) +"\r\n";
                lineArr.push(text);
               line =  line.substr(boxLineDispLength-2);
            }
            if(line.length !== 0){
                lineArr.push(line + "\r\n");
            }
           rline++;
        }
        return lineArr;
    },

    _initPassAnyKeyIcon:function(){

        var self = this;
        var imgURL = "img/loading.gif"; //图片地址

        this._passKeyImg = document.getElementById(this.PASS_ANY_KEY_ICON_ID);
        if(this._passKeyImg !== null){
            this._passKeyImg.parentElement.removeChild(this._passKeyImg);
        }
        var imgObj = new Image();
        imgObj.onload = function(){
            this.style.display = "none";
            this.style.position = "absolute";
            this.id = self.PASS_ANY_KEY_ICON_ID;
            self.getGroup().getLayer().getCanvas().element.parentNode.appendChild(this);
            self._retSetPassAnyKeyImgPos();
        };
        imgObj.src = imgURL;
        this._passKeyImg = imgObj;
    },
    _retSetPassAnyKeyImgPos:function(){
        var baseX = this.getGroup().getLayer().getCanvas().element.offsetLeft + this.x;
        var baseY = this.getGroup().getLayer().getCanvas().element.offsetTop + this.y;
        var imgObj = document.getElementById(this.PASS_ANY_KEY_ICON_ID);
        if(imgObj === null){
            return false;
        }
        var x = baseX + this.width - imgObj.width - 5;
        var y = baseY + this.height - imgObj.height - 5;
        imgObj.style.left = x + "px";
        imgObj.style.top =  y + "px";
        return true;
    },
    _showPassAnyKeyIcon:function(){
        var imgObj = document.getElementById(this.PASS_ANY_KEY_ICON_ID);
        if(imgObj === null){
            return false;
        }
        imgObj.style.display = "block";
    },
    _hidePassAnyKeyIcon:function(){
        var imgObj = document.getElementById(this.PASS_ANY_KEY_ICON_ID);
        if(imgObj === null){
            return false;
        }
        imgObj.style.display = "none";
    }
});
/**
 * Created with JetBrains WebStorm.
 * User: sorakasugano
 * Date: 13-4-16
 * Time: 上午10:09
 * To change this template use File | Settings | File Templates.
 */


(function(Reitsuki){
    Reitsuki.ScriptManager = function ScriptManager(messageCenter){
        this.messageCenter = messageCenter;
        this.CMDS = [];
        this.scriptExecutor = new Reitsuki.ScriptExecutor(this);
        this.pause = false;
    };

    Reitsuki.ScriptManager.prototype.loadScriptToFile = function(filename){
        // AjAX
        var request = new XMLHttpRequest();
        request.open("GET",filename);
        request.setRequestHeader("Content-Type","text/plain;charset=UTF-8");
        request.onreadystatechange = function(){
            if(request.readyState === 4 && request.status === 200){
                var type = request.getResponseHeader("Content-Type");
                if(type.match(/^text/)){
                    self.scriptExecutor.loadScript(request.responseText);
                }else{
                    throw new Error("Load script file( "+ filename +" ) error, response type is not Text.");
                }
            }else if(request.readyState === 4 && (request.status === 404 || request.status === 500) ){
                throw new Error("Load script file( "+ filename +" ) error, Http Code:" + request.status);
            }
        };
        request.send(null);
    };

    Reitsuki.ScriptManager.prototype.loadScriptFromString = function(script){
        this.scriptExecutor.loadScript(script);
    };

    Reitsuki.ScriptManager.prototype.loadScriptFromElement = function(id){
        var ele = document.getElementById(id);
        if(!ele){
            throw new Error("Load script element( "+ id +" ) error, Http Code:" + request.status);
        }
        this.scriptExecutor.loadScript(ele.innerText);
    };

    Reitsuki.ScriptManager.prototype.getNextScripts = function(){
         if(this.pause === true){
             return [];
         }
        this.scriptExecutor.next();
        if(this.CMDS.length === 0){

            return [];
        }else{
            return this.CMDS.shift();
        }
    };

    Reitsuki.ScriptManager.prototype.createCMD = function(componentName,methodName,param){
        return {
            componentName:componentName,
            methodName:methodName,
            param:param
        };
    };

    Reitsuki.ScriptManager.prototype.runCMD = function(cmd){
      this.messageCenter.shiftRUN(cmd);
    };

})(Reitsuki);
/**
 * @author sorakasugano
 * 选择框组件
 * TODO 完成各种属性的getter setter
 */
var SelectBoxComponent = ComponeBase.extend({
    init:function(o){
        this._super();
        this.name = "SelectBoxComponent";
        if(!o.layer){
            throw new TypeError("param layer is not set");
        }
        this.layer = o.layer;

        // 文本样式设置
        this._textColor = o.textColor ? o.textColor : "white";
        this._textSize = o.textSize ? o.textSize : 14;
        this._fontFamily = o.fontFamily ? o.fontFamily :"'Microsoft YaHei',Verdana,Helvetica,sans-serif,Arial,Tahoma";
        this._textAlign = "center";
        // 背景设置

        if(!o.hasOwnProperty("background")){
            o.background = "img/selectbk.png";
        }
        this._background = o.background;

        if(o.hasOwnProperty("hoverBackground")) {
            this._hoverBackground = o.hoverBackground;
        }else{
            this._hoverBackground = "img/selectHover.png";
        }

        if(o.hasOwnProperty("activeBackground")) {
            this._activeBackground = o.activeBackground;
        }else{
            this._activeBackground = this._hoverBackground;
        }

        this._backgroundImage = null;
        this._hoverBackgroundImage = null;
        this._activeBackgroundImage = null;
        this._initBackground();

        this._itemGroup = new Kinetic.Group({});
        this.layer.add(this._itemGroup);

        // 最后一次选的内容
        this._lastSelectText = "";
    },

    setTextSize:function(size){
        this._textSize = size;
    },
    setTextFontFamily:function(fontFamily){
        this._fontFamily = fontFamily;
    },
    setTextColor:function(color){
        this._textColor = color;
    },

    setTextAlign:function(align){
        this._textAlign =  align;
    },

    setSelectItem:function(o){

        //收到载入进度消息,直接关闭对话框
        if(this.content.intLoadEvent){
            this.content.intLoadEvent = false;
            return this.COMPLETE_FLAG;
        }

        if(this.content.selected  === true){
            this._itemGroup.children = [];
            this._reDraw();

            // 显示脚本框
            o.messageCenter.broadcast("showScriptBox",{});

            return this.COMPLETE_FLAG;
        }

       if(this.content.init === true){
          return;
       }
       this.content.init = true;

       var callback = o.callback;
       var items = o.item;
       var NEXT_ITEM_MARGIN_BOTTOM = 10;
       var MARGIN_TOP_BOTTOM = 5;
       var MARGIN_LEFT_RIGHT = 10;

       var self = this;
       var maxItemLength = 0;
       var itemWidth,itemHeight,textBoxWidth;
       var selectKTexts = [];
       var selectBackgrounds = [];

       var i,l;
       this._itemGroup.children = [];

       for( i = 0, l = items.length; i < l; i++){
           var item = items[i];
           if(item.length > maxItemLength){
               maxItemLength = item.length;
           }


           var kText = new Kinetic.Text({
               text:item,
               fontSize:this._textSize,
               fontFamily:this._fontFamily,
               fill:this._textColor
           });

           selectKTexts.push(kText);


           var backgroundObj = new Kinetic.Rect({
              image:null,
               fillPatternImage:this._backgroundImage,
               fillPatternRepeat:"repeat"
           });

           selectBackgrounds.push(backgroundObj);
       }

       var testKText = selectKTexts[0];
        textBoxWidth =  testKText.getFontSize() * maxItemLength;
        itemWidth = textBoxWidth  + MARGIN_LEFT_RIGHT * 2;
        itemHeight = testKText.getLineHeight() + testKText.getFontSize() + MARGIN_TOP_BOTTOM * 2;

        var nextItemY = 0;
        //绑定鼠标事件
        var mouseoverEventHandle = function (){
            selectBackgrounds[this._Rei_Obj_Index].setFillPatternImage(self._hoverBackgroundImage);
            self._reDraw();
        };

        var mousedownEventHandle = function (){
            selectBackgrounds[this._Rei_Obj_Index].setFillPatternImage(self._activeBackgroundImage);
            self._reDraw();
        };

        var mouseoutEventHandle = function(){
            selectBackgrounds[this._Rei_Obj_Index].setFillPatternImage(self._backgroundImage);
            self._reDraw();
        };

        var clickEventHandle = function(){
            self._lastSelectText = this._Rei_value;
            if(typeof callback == "function"){
                callback(this._Rei_value);
            }
            self.content.selected = true;
        };
        for(i = 0, l = selectKTexts.length; i < l; i++){
            var bkObj = selectBackgrounds[i];
            var textObj = selectKTexts[i];

            bkObj.setWidth(itemWidth);
            bkObj.setHeight(itemHeight);
            bkObj.setX(0);
            bkObj.setY(nextItemY);
            nextItemY += itemHeight + NEXT_ITEM_MARGIN_BOTTOM;

            var textX = bkObj.getX() + MARGIN_LEFT_RIGHT;
            var textY = bkObj.getY() + MARGIN_TOP_BOTTOM;
            textObj.setX(textX);
            textObj.setY(textY);
            textObj.setWidth(textBoxWidth);
            textObj.setAlign(this._textAlign);
            textObj._Rei_Obj_Index = i;
            bkObj._Rei_Obj_Index =i;

            bkObj._Rei_value = textObj.getText();
            textObj._Rei_value = textObj.getText();

            bkObj.on("mouseover mouseup",mouseoverEventHandle);
            bkObj.on("mousedown",mousedownEventHandle);
            bkObj.on("mouseout",mouseoutEventHandle);
            bkObj.on("click",clickEventHandle);

            textObj.on("mouseover mouseup",mouseoverEventHandle);
            textObj.on("mousedown",mousedownEventHandle);
            textObj.on("mouseout",mouseoutEventHandle);
            textObj.on("click",clickEventHandle);

            this._itemGroup.add(bkObj);
            this._itemGroup.add(textObj);
        }
        this._itemGroup.setWidth(itemWidth) ;

        var selecterBoxHeight = (itemHeight + NEXT_ITEM_MARGIN_BOTTOM) * (selectKTexts.length - 1) -
                       NEXT_ITEM_MARGIN_BOTTOM;
        if(selecterBoxHeight < 0){
            selecterBoxHeight = 0;
        }
        this._itemGroup.setHeight(selecterBoxHeight);

        // 设置选择框居中
        var stage = this.layer.getStage();
        var selecterBoxX = stage.getWidth() / 2 - this._itemGroup.getWidth() /2;
        var selecterBoxY = stage.getHeight() /2 - this._itemGroup.getHeight() /2;
        this._itemGroup.setX(selecterBoxX);
        this._itemGroup.setY(selecterBoxY);

        // 隐藏脚本框
        o.messageCenter.broadcast("hideScriptBox",{});

        // 重绘
        this._reDraw();
    },
    getLastSelectItemText:function(){
        return this._lastSelectText;
    },

    _B_LOADEVENT:function(){
        this.content.intLoadEvent = true;
    },

    _load_Image:function(varName_url,callback){
        var self = this;
        var loadCount = 0;
        var errCount = 0;
        var urls = [];
        var result = {};
        var imgObjs = [];
        if(typeofEX(varName_url) == "array"){
            urls = varName_url;
        }else{
            urls.push(varName_url);
        }

        var imgOnloadCallback = function(){
            result[this._name_url.name] = this;
            loadCount++;
            checkComplete();
        };

        var imgOnErrCallback = function(){
            result[this._name_url.name] = null;
            errCount++;
            checkComplete();

        };

        for(var i= 0,l = urls.length; i < l; i++){
            imgObjs.push(new Image());
            var img = imgObjs[imgObjs.length - 1];
            var name_url = urls[i];
            img._name_url =name_url;
            img.onload = imgOnloadCallback;
            img.onerror = imgOnErrCallback;
            img.src = name_url.url;
        }

        function checkComplete(){
            if((loadCount + errCount) == urls.length){
                callback(result);
            }
        }

    },
    _initBackground:function(){
        var self = this;
        this._load_Image(
            [
                {name:"_background",url: this._background},
                {name:"_hoverBackground",url: this._hoverBackground},
                {name:"_activeBackground",url: this._activeBackground}
            ],
            function(result){
                if(result._hoverBackground == null){
                    result._hoverBackground = result._background;
                }
                if(result._activeBackground == null){
                    result._activeBackground = result._hoverBackground;
                }

                self._backgroundImage = result._background;

                self._hoverBackgroundImage = result._hoverBackground;

                self._activeBackgroundImage = result._activeBackground;

            });
    },

    /**
     * 重绘
     * @private
     */
    _reDraw:function(){
        var layer = this.layer;
        layer.clear();
        layer.draw();
    }

});
/**
 * @author sorakasugano
 * 声音组件的组件
 */

var SoundComponent =  ComponeBase.extend({
    init:function(soundType,soundFileType){
        this._super();
        this.sound = new Audio();
        this.isLoop = false;
        this.name = soundType.toUpperCase() + "Component";

        if(!soundFileType){
            this.soundFileType = "ogg";
        }

        this.SoundDir = "";
        switch(soundType.toLowerCase()){
            case "bgm":
                this.isLoop = true;
                this.SoundDir = "bgm";
            break;

            case "voice":
                this.isLoop = false;
                this.SoundDir = "voice";
            break;

            case "sound":
                this.isLoop = false;
                this.SoundDir = "sound";
            break;

            default :
                throw new Error("SoundType is error,[voice,sound,bgm]");

        }
    },
    _B_setSoundFileType :function(fileType){
        this.soundFileType = fileType;
    },
    /**
     * 播放声音
     * @param {string}o.name 播放声音的名字 不含扩展名
     */
    play:function(o){
        var soundName = o.name;
        this.sound.loop = this.isLoop;
        this.sound.preload = true;
        this.sound.src = this.SoundDir + "/" + soundName + "." + this.soundFileType;
        if(this.sound.currentTime !== 0){
            this.sound.currentTime = 0;
        }
        this.sound.play();
        return this.COMPLETE_FLAG;
    },
    stop:function(){
        this.sound.pause();
        return this.COMPLETE_FLAG;
    },

    _B_STOP_SOUND:function(){
        this.stop();
    }
});
/**
 * @author sorakasugano
 */

var VideoComponent = ComponeBase.extend({
    init:function(){
        this._super();
        this.name = "VideoComponent";
    },

    play:function(o){
       var content = this.content;
       var mp4Src = "video/" + o.mp4Src;
       var oggSrc = "video/" + o.oggSrc;
       if(content.init === undefined){
           content.init = true;
           var video = this._createVideoEle(mp4Src,oggSrc);
           var dev = o.dev;
           var devContent = dev.getContent();
          // var x =  devContent.offsetLeft;
          // var y = devContent.offsetTop;
           var width = devContent.offsetWidth;
           var height = devContent.offsetHeight;

           video.style.position = "absolute";
           video.width = width;
           video.height = height;
           //video.style.top = y;
          // video.style.left = x;
           video.style["z-index"] = 200;
           devContent.appendChild(video);
           video.load();
           video.play();
           content.video = video;

           this.messageCenter.broadcast("STOP_SOUND",null);
       }

        if(content.video.ended){
            content.video.parentNode.removeChild(content.video);
            return this.COMPLETE_FLAG;
        }
    },

    _B_INGAME_KB_PASS_KEY:function(keyCode){
        if(this.content.video === undefined){
            return;
        }

        if(keyCode == 122 || keyCode == 13){
            this.content.video.currentTime = this.content.video.duration;
        }
    },

    _createVideoEle: function(mp4Src,oggSrc){
        var video  = document.createElement("video");
        video.width = this.dev.getWidth();
        video.height = this.dev.getHeight();
        var mp4Source = document.createElement("source");
        mp4Source.src = mp4Src;
        mp4Source.type = "video/mp4";

        var oggSource = document.createElement("source");
        oggSource.src = oggSrc;
        mp4Source.type = "video/ogg";

        video.appendChild(mp4Source);
        video.appendChild(oggSource);
        return video;
    }

});
/**
 * Created with JetBrains WebStorm.
 * User: sorakasugano
 * Date: 13-4-10
 * Time: 下午12:56
 * Reitsuki Galgame Engine
 */

(function(Reitsuki){

    /**
     *
     * @param {Object}parameters  Reitsuki GalGame Init need parmeters
     * @param {String|Element} parameters.container Use for Game display Canvas
     * @param {Number} [parameters.width canvas width]
     * @param {Number} [parameters.height canvas height]
     * @param {Object} [parameters.characterSetting]   character image config info
     * @parma {String} [parameters.soundFileType] Sound file extension
     * @constructor
     */
    Reitsuki.init  = function ReitsukiGame(parameters){
        var container = parameters.container;
        var self = this;

        this.engineStatus = "INIT";

        if(container === undefined){
            throw "container need defined";
        }
        if(typeof container === "string"){
            this.container = document.getElementById(container);
            if(this.container === null){
                throw "Has not ID:" + container + "HTML element";
            }else{
                this.container = container;
            }
        }


        this.width =  parameters.width === undefined ? window.innerWidth : parameters.width;
        this.height =  parameters.height === undefined ? window.innerWidth : parameters.height;
        this.dev = new Kinetic.Stage({
            container:this.container,
            width:this.width,
            height:this.height
        });


        this.messageCenter = new MessageCenter(this.dev);
        this.scriptManager = new Reitsuki.ScriptManager(this.messageCenter );


        var bgComponent = new BGComponent(this.dev);
        this.messageCenter.registerComponent(bgComponent);


        var characterSetting =  parameters.characterSetting === undefined ? {} :  parameters.characterSetting;
        var chComponent = new CHComponent(this.dev,characterSetting);
        this.messageCenter.registerComponent(chComponent);

        var bgmComponent = new SoundComponent("bgm",parameters.soundFileType);
        var voiceComponent = new SoundComponent("voice",parameters.soundFileType);
        var soundComponent = new SoundComponent("sound",parameters.soundFileType);
        this.messageCenter.registerComponent(bgmComponent);
        this.messageCenter.registerComponent(voiceComponent);
        this.messageCenter.registerComponent(soundComponent);

        var videoComponent = new VideoComponent();
        this.messageCenter.registerComponent(videoComponent);

        var dialogComponent = new DialogComponent();
        this.messageCenter.registerComponent(dialogComponent);

        var uiLayer = new Kinetic.Layer({width:this.width,height:this.height,x:0,y:0});
        this.dev.add(uiLayer);

        var scriptBoxComponent = new ScriptDispBoxComponent({
            layer:uiLayer
        });
        this._scriptBoxAreaElement =  scriptBoxComponent.buttonAreaEle;

        this.messageCenter.registerComponent(scriptBoxComponent);

        //注册脚本管理器
        this.messageCenter.registerscriptManager(this.scriptManager );

        this.dev.getContent().addEventListener("click",function(e){
            self.messageCenter.broadcast("INGAME_MOUSE_KEY", e);
        },false);

        document.addEventListener("keypress",function(e){
            self.messageCenter.broadcast("INGAME_KB_PASS_KEY", e.which);
        },false);

        var selectBoxComponent = new SelectBoxComponent({
            layer:uiLayer
        });
        this.messageCenter.registerComponent(selectBoxComponent);

        this.engineStatus = "READY"; //引擎初始化成功
        this.isPause = false;




        this.GameLoop = new Kinetic.Animation(function(frame){
            if (self.isPause) {
                return;
            }
            self.messageCenter.update();
        });
    };

    /**
     * start game
     */
    Reitsuki.init.prototype.start = function(){
        this.messageCenter.broadcast("ENG_START",null);//广播 游戏开始的消息
        this.GameLoop.start();
    };

    /**
     * stop game
     */
    Reitsuki.init.prototype.stop = function(){
        this.messageCenter.broadcast("ENG_STOP",null);  //广播游戏结束的消息
        this.GameLoop.stop();
    };

    /**
     * 广播对当前对话框已经关闭消息
     * @param result
     */
    Reitsuki.init.prototype.closeDialog = function(result){
        this.messageCenter.broadcast("CLOSE_DIALOG",result);
    };

    /**
     * 立即现实对话框
     * @param id
     */
    Reitsuki.init.prototype.showDailog = function(id){
        this.scriptManager.runCMD(this.scriptManager.createCMD("DialogComponent","show",{id:id}));
    };

    /**
     * 注册右键对话框
     * @param id
     */
    Reitsuki.init.prototype.registerRightClickDailog = function(id){
        var self = this;
        function dispDailog(){
            var hasDispDailog = false;
            self.messageCenter.broadcast("QUERY_DISPLAY_DAILOG",function(nowDailog){
                if(nowDailog !== null){
                    hasDispDailog = false;
                }
            });
            if(hasDispDailog === false){
                self.scriptManager.runCMD(self.scriptManager.createCMD("DialogComponent","show",{id:id}));
            }
            return false;
        }

        this.dev.getContent().oncontextmenu = dispDailog;
    };

    /**
     * 储存游戏
     * @param {string}[name] 存档名字
     * @param {boolean}[isAutoSave] 是否属于自动存档
     */
    Reitsuki.init.prototype.save = function(name,isAutoSave){
        if(name === undefined){
            name = (new Date()).toLocaleString();
        }
        var saveDataList = Reitsuki.localStorage.get("saveDataList");
        if( saveDataList === undefined ){
            saveDataList = [];
        }

        var saveDava = {name:name, data:this.scriptManager.scriptExecutor.saveGame() };

        if( isAutoSave !== false  && saveDataList.length >0 ){
            saveDataList[0] =  saveDava;
        }else{
            saveDataList.push(saveDava);
        }

        Reitsuki.localStorage.set("saveDataList",saveDataList);
    };

    /**
     * 载入游戏进度
     * @param {string}[name] 进度名字,忽略的话为自动储存进度
     * @returns {boolean}是否载入成功
     */
    Reitsuki.init.prototype.load = function(name){
        var saveDataList = Reitsuki.localStorage.get("saveDataList");
        var saveData;

        if(saveDataList.length === 0){
            return false;
        }

        if( name === undefined){
            saveData = saveDataList[0];
        }else{
            for(var i = 0,l = saveDataList.length; i < l; i++){
                saveData = saveDataList[i];
                if(saveData.name === name){
                    break;
                }
            }
        }

        if(saveData === undefined){
            return false;
        }else{
            this.scriptManager.scriptExecutor.loadGame(saveData.data);
            return true;
        }
    };

    Reitsuki.init.prototype.hasSaveData = function(){
        var saveDataList = Reitsuki.localStorage.get("saveDataList");
        if(saveDataList !== undefined && saveDataList.length !== 0){
            return true;
        }else{
            return false;
        }
    };

    /**
     * 获得脚本框按钮区域的Element
     * @returns {element}
     */
    Reitsuki.init.prototype.getScriptBoxButtomAreaElement = function(){
        return this._scriptBoxAreaElement;
    };


    //----------------------------------------------------
    Reitsuki.extend = function extend(subClass, baseClass) {
        function Inheritance() {}
        Inheritance.prototype = baseClass.prototype;

        subClass.prototype = new Inheritance();
        subClass.prototype.constructor = subClass;
        subClass.baseConstructor = baseClass;
        subClass.superClass = baseClass.prototype;
    };

    Reitsuki._trim = function(text){return text.replace(/^\s+|\s+$/g, '');};



    Reitsuki.localStorage = {};
    Reitsuki.localStorage.prefix =  stringHash(window.location.hostname + window.location.pathname) + '-';
    Reitsuki.localStorage.get = function(key){
        if(!window.localStorage){
            return;
        }
        var reslut =  window.localStorage[ Reitsuki.localStorage.prefix + key];
         if(reslut !== undefined){
             return JSON.parse(window.localStorage[ Reitsuki.localStorage.prefix + key]);
         }
    };

    Reitsuki.localStorage.set = function(key,value){
        if(!window.localStorage){
            return false;
        }
        window.localStorage[ Reitsuki.localStorage.prefix + key] = JSON.stringify(value);
        return value;
    };

    Reitsuki.localStorage.clear = function(){
      for(var key in window.localStorage){
          if(window.localStorage.hasOwnProperty(key)){
              if(key.indexOf(Reitsuki.localStorage.prefix) === 0){
                  window.localStorage.removeItem(key);
              }
          }
      }
    };

    Reitsuki.localStorage.remove = function(key){
        window.localStorage.removeItem( Reitsuki.localStorage.prefix + key );
    };
})(Reitsuki);

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
   var chResult = this._procCHImage(text);
    text = chResult.text;
    var CMDS = [];
    var textComponent = this._outTextLabel + "Component";
    if(chResult.chCMD){
        CMDS.push(chResult.chCMD);
    }
    CMDS.push(this.scriptManager.createCMD(textComponent,"setText",{text:text}));

    CMDS.push(this.scriptManager.createCMD("CHComponent","clearCharacter",{}));
    this.scriptManager.CMDS.push(CMDS);

};


/**
 * set Character image
 *   春日野穹(笑),诗音(高兴),夏川真凉：今天的天气真好
 * @param text
 * @returns {*}
 * @private
 */
Reitsuki.ScriptExecutor.prototype._procCHImage = function(text){
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
    for(var i = 0,l = chImageSetting.length; i < l; i++){
        var m = reg.exec(chImageSetting[i]);
        if(m){
           var name = m[1];
           var imgNum = m[2];
            character.push({charName:name,charNum:imgNum});
            chNams.push(m[1]);
        }else{
            chNams.push(chImageSetting[i]);
        }
    }

    text = chNams.join(',') + "：" + text.substr(colonIndex+1);
    var result = {};
    if(character.length > 0){
        result.chCMD = this.scriptManager.createCMD("CHComponent","setCharacter",{character:character});
    }else{
        result.chCMD = null;
    }
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
        this.scriptManager.createCMD("VoiceComponent","play",{name:sound})
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

Reitsuki.ScriptExecutor.prototype.video = function(mp4Src,oggSrc){
    this.scriptManager.CMDS.push([
        this.scriptManager.createCMD("VideoComponent","play",{mp4Src:mp4Src,oggSrc:oggSrc})
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
