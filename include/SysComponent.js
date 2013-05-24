/**
 * @author sorakasugano
 */

var SysComponent = ComponeBase.extend({
    init:function(){
        this._super(); //初始化基类
        this.name = "SysComponent"; //组件名称
    } ,
    wait:function(o){
        if(this.content.init === undefined){
            this.content.init = true;
            this.content.timestampA = (new Date()).getTime();

        }
        var pastTime = (new Date()).getTime() - this.content.timestampA;
        if(pastTime >= o.time){
            return this.COMPLETE_FLAG;
        }
    }
});