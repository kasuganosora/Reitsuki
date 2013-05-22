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