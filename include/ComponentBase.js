/**
 * Created with JetBrains WebStorm.
 * User: sorakasugano
 * Date: 13-4-12
 * Time: 上午10:56
 * retsuki.tool.js
 */

var ComponeBase = Class.extend({
    /**
     * 组件的基类
     * @constructor
     */
    init:function(){
        this.hasError = false;
        this.name = "componeBase";
        /**
         *  Update need Contents;
         * @type {Object}
         */
        this.content = {};
        this.cmd = null;
        this.messageCenter = null;
        this.dev = null;
    },
    COMPLETE_FLAG:"COMPLETE",

    update:function(){
        var COMPLETE_FLAG = this.COMPLETE_FLAG;
        if(this.cmd === null){
            this.reset();
            return COMPLETE_FLAG;
        }

        var cmd = this.cmd;
        if(!this.hasMethod(cmd.methodName)){
            console.log("组件:" + this.name + " 不支持方法:"+ cmd.methodName);
            this.reset();
            return COMPLETE_FLAG;
        }


        if( this[cmd.methodName](cmd.param) == this.COMPLETE_FLAG){
            this.reset();
            return COMPLETE_FLAG;
        }
    },
    reset:function(){
        this.cmd = null;
        this.content = {};
        this.hasError = false;
    },
    exec:function(cmd) {
        this.reset();
        this.cmd = cmd;
    },
    hasMethod:function(methodName){
        if(this[methodName] !== undefined && typeof this[methodName] == "function"){
            return true;
        }else{
            return false;
        }
    }

});


