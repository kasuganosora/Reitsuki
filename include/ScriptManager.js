/**
 * Created with JetBrains WebStorm.
 * User: sorakasugano
 * Date: 13-4-16
 * Time: 上午10:09
 * To change this template use File | Settings | File Templates.
 */


(function(Reitsuki){
    Reitsuki.ScriptManager = function ScriptManager(messageCenter){
        this.messageCenter = messageCenter;
        this.CMDS = [];
        this.scriptExecutor = new Reitsuki.ScriptExecutor(this);
        this.pause = false;
    };

    Reitsuki.ScriptManager.prototype.loadScriptToFile = function(filename){
        // AjAX
        var request = new XMLHttpRequest();
        request.open("GET",filename);
        request.setRequestHeader("Content-Type","text/plain;charset=UTF-8");
        request.onreadystatechange = function(){
            if(request.readyState === 4 && request.status === 200){
                var type = request.getResponseHeader("Content-Type");
                if(type.match(/^text/)){
                    self.scriptExecutor.loadScript(request.responseText);
                }else{
                    throw new Error("Load script file( "+ filename +" ) error, response type is not Text.");
                }
            }else if(request.readyState === 4 && (request.status === 404 || request.status === 500) ){
                throw new Error("Load script file( "+ filename +" ) error, Http Code:" + request.status);
            }
        };
        request.send(null);
    };

    Reitsuki.ScriptManager.prototype.loadScriptFromString = function(script){
        this.scriptExecutor.loadScript(script);
    };

    Reitsuki.ScriptManager.prototype.loadScriptFromElement = function(id){
        var ele = document.getElementById(id);
        if(!ele){
            throw new Error("Load script element( "+ id +" ) error, Http Code:" + request.status);
        }
        this.scriptExecutor.loadScript(ele.textContent || ele.innerText );
    };

    Reitsuki.ScriptManager.prototype.getNextScripts = function(){
         if(this.pause === true){
             return [];
         }
        this.scriptExecutor.next();
        if(this.CMDS.length === 0){

            return [];
        }else{
            return this.CMDS.shift();
        }
    };

    Reitsuki.ScriptManager.prototype.createCMD = function(componentName,methodName,param){
        return {
            componentName:componentName,
            methodName:methodName,
            param:param
        };
    };

    Reitsuki.ScriptManager.prototype.runCMD = function(cmd){
      this.messageCenter.shiftRUN(cmd);
    };

})(Reitsuki);