/**
 * Created with JetBrains WebStorm.
 * User: ReitsukiSion
 * Date: 13-3-20
 * Time: 下午4:02
 * 本文档是设置角色名与其立绘图片对应的文件名
 * 例如脚本里的叫 春日野穹(1) 那么代表使用了春日野穹的1立绘
 * 如果在这文件设置 "春日野穹":"KasuganoSora"的话 那么程序就会去找 character文件夹里的KasuganoSora-1.png
 * 如果这文件里没有找到相应角色配置的话 程序就不会显示相应的角色立绘
 *
 * 本文件应该在Reitsuki.js之前引入
 * 并且在 初始化 Reitsuki 的时候 参数opt.charactersSetting 带入
 * 如
 * var opt = {
 *   charactersSetting :charactersSetting
 * } ;
 * var game = new Reitsuki(container,opt);
 */

var charactersSetting;
charactersSetting = {
	"filetype":"png",
	"春日野穹":"sora" ,
	"A君":"kazuha"
};
