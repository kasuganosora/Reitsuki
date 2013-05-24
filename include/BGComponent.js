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

    _B_SET_BGDIR:function(o){
        this.BGDir = o;
    },
    _B_SET_BGFILE_TYPE:function(o){
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