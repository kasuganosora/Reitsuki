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
