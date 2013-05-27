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
            layer:uiLayer,
            textBoxX:parameters.textBoxX,
            textBoxY:parameters.textBoxY,
            textBoxWidth: parameters.textBoxWidth,
            textBoxHeight: parameters.textBoxHeight,
            sbWidth:parameters.sbWidth,
            sbHeight:parameters.sbHeight
        });

        this._scriptBoxAreaElement =  scriptBoxComponent.buttonAreaEle;

        this.messageCenter.registerComponent(scriptBoxComponent);

        var sysComponent = new SysComponent();
        this.messageCenter.registerComponent(sysComponent);
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

    Reitsuki._dispatchEvent = function(ele,eventType,data){
        if(ele.dispatchEvent){
            var ev = document.createEvent("HTMLEvents");
            ev.initEvent(eventType,false,false);
            ev.data = data;
            ele.dispatchEvent(ev);
            return true;
        } else if(ele.fireEvent){
            //IE
            var e = document.createEventObject();
            e.data = data;
            ele.fireEvent(eventType, e);
            return true;
        }
        return false;
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

