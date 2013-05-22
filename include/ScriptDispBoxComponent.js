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