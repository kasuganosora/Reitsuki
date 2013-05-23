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

       if(content.init === undefined){

           content.init = true;
           var video = this._createVideoEle(o.mp4, o.webm, o.ogg);
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

        if(content.video.ended  || content.error){
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

    _createVideoEle: function(mp4,webm,ogg){
        var video  = document.createElement("video");
        video.width = this.dev.getWidth();
        video.height = this.dev.getHeight();
        video.id = "xx1";
        var source;

        var canPlayMP4 = video.canPlayType('video/mp4; codecs="avc1.4D401E, mp4a.40.2"');
        var canPlayWEBM = video.canPlayType('video/webm; codecs="vp8.0, vorbis"');
        var canPlayOgg  =  video.canPlayType('video/ogg; codecs="theora, vorbis"');

        if(canPlayMP4 === "probably" && mp4){
            source = document.createElement("source");
            source.src = "video/" + mp4;
            source.type = "video/mp4";
            video.appendChild(source);
        }else if(canPlayWEBM === "probably" && webm){
            source = document.createElement("source");
            source.src = "video/" + webm;
            source.type = "video/webm";
            video.appendChild(source);
        }else if(canPlayOgg === "probably" && ogg){
            source = document.createElement("source");
            source.src = "video/" + ogg;
            source.type = "video/ogg";
            video.appendChild(source);
        }else{
            this.content.error = true;
        }


        var self = this;
        video.onerror = function(){
            self.content.error = true;
        };

        return video;
    }


});