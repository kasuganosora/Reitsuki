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