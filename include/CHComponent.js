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
            if(self.loadedCHImg[charName] === undefined){
                self.loadedCHImg[charName] = {};
            }
            self.loadedCHImg[charName][charNum]  = null;
            console.log("Character Image:"+ charName + "("+ charNum +")"+" load fail");
        };
        imgObj.src = imgUrl;

        return true;
    },

    _queryCHImgFileName:function(charName,charNum){

        if(this.charTable === undefined || this.charTable === null){
            return this.CHDir + "/" + charNum + "." + this.CHFileType;
        }

        if(this.charTable[charName] === undefined || this.charTable[charName][charNum] === undefined){
            return null;
        }
        return this.CHDir + "/" + this.charTable[charName][charNum] + "." + this.CHFileType;
    }


});