/**
 * Created with JetBrains WebStorm.
 * User: sorakasugano
 * Date: 13-4-10
 * Time: 下午3:35
 * Reitsuki Galgame MessageCenter
 */

/**
 * 信息中心,用来分发和调度来至脚本执行器的命令到各个组件上执行
 * @param {Kinetic.Stage}dev Kinentic.Stage 舞台对象
 * @constructor
 */
function MessageCenter(dev){
    this.components = {};
    this.scriptManager = null;
    this.dev = dev;
    this.cmds = [];
    this.nowRunningCompName = "";
}

MessageCenter.prototype.update = function(){
    if(this.cmds.length === 0){
       this._getScriptCMDS();
    }

    if(this.cmds.length === 0){
        this.nowRunningCompName = "";
        return;
    }

    if(this.nowRunningCompName === ""){
        this._nextCMDSendComponentExec();
    }

    var runningComp = this.components[this.nowRunningCompName];
    if(runningComp.update() == "COMPLETE"){
        //组件运行完成
        runningComp.reset();
        this.cmds.shift(); // 移除已经完成的命令
        this._nextCMDSendComponentExec();//把下一条命令发送给组件运行
    }

};
MessageCenter.prototype.shiftRUN = function(cmd){
    this.cmds.unshift(cmd);
    this._nextCMDSendComponentExec();

};

MessageCenter.prototype.registerscriptManager = function(scriptManager){
    this.scriptManager =  scriptManager;
};

MessageCenter.prototype.registerComponent = function(component){
    if(this.components[component.name.toLowerCase()] === undefined){
        this.components[component.name.toLowerCase()] = component;
        component.messageCenter = this;
        component.dev = this.dev;
    }

};

MessageCenter.prototype.getComponent =  function(componentName){
    if(this.components[componentName.toLowerCase()] !== undefined){
       return this.components[componentName.toLowerCase()];
    }

};

MessageCenter.prototype.broadcast = function (message,prama){
     if(prama === null || prama === undefined){
         prama = {};
     }
    for(var compName in this.components){
        var comp = this.components[compName];
        if(typeof comp["_B_" + message.toUpperCase()] == "function"){
            prama.dev = this.dev;
            prama.messageCenter = this;
            comp["_B_" + message.toUpperCase()](prama);
        }
    }
};

MessageCenter.prototype._getScriptCMDS = function(){
    this.cmds = this.scriptManager.getNextScripts();
};


MessageCenter.prototype._nextCMDSendComponentExec = function(){
    if(this.cmds.length === 0){
        this.nowRunningCompName = "";
        return;
    }
    var cmd = this.cmds[0];

    if(this.components[cmd.componentName.toLowerCase()] === undefined){
        console.log("命令:"+ cmd.methodName + "依赖的组件:" + cmd.componentName + "不存在");
        return;
    }

    cmd.param.dev = this.dev;
    cmd.param.messageCenter = this;
    this.nowRunningCompName = cmd.componentName.toLowerCase();
    this.components[cmd.componentName.toLowerCase()].exec(cmd); // 执行
};

