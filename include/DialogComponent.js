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
            Reitsuki._dispatchEvent(this.content.dialog,"dailogShow",this.name); //send dialog show message
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
            if(this.content.dailog.style.display !== "none"){
                Reitsuki._dispatchEvent(this.content.dialog,"dailogClose",this.name); //send dialog close message
            }
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