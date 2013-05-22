Reitsuki JavaScript Galgame framework
========

依赖于以下两个库
Jquery http://jquery.com/
kineticjs http://kineticjs.com/

# 如何开始

## 初始化游戏对象
 var gal = new Reitsuki.init({
            container:"game",
            height:600,
            width:800,
            characterSetting:characterSetting
        });
其中container 参数为游戏显示在那个div里的标签
height 参数为高度
width为宽度
characterSetting 立绘设置

## 加载脚本
Reitsuki 有2种加载脚本方式
一直那个是直接在element里加载
gal.scriptManager.loadScriptFromElement("main"); //加载id为main里面的内容作为脚本
另一种是通过ajax来加载
gal.scriptManager.loadScriptToFile("main.txt"); //其中main.txt是文件路径

## 最后是开始游戏
gal.start();

## 这里补充下characterSetting 立绘设置的例子
var characterSetting = {
    "春日野穹":{"白色-笑":"sora-1","校服-一般-白天":"sora-2","校服-一般-黄昏":"sora"},
    "渚一叶":{"校服-笑":"kazuha-1"}
};

例如 "春日野穹":{"白色-笑":"sora-1","校服-一般-白天":"sora-2","校服-一般-黄昏":"sora"}, 这行

其中为"春日野穹" 为角色的名字 
后面大括号里的'{"白色-笑":"sora-1","校服-一般-白天":"sora-2","校服-一般-黄昏":"sora"}' 为对应的立绘文件对应
立绘文件文件类型为jpg
在脚本里 例如

春日野穹(校服-一般-白天)：今天要和哥哥出去

的话就会在游戏里显示sora-2.jpg这个文件
最后立绘文件是放在 character 这个文件夹里的

# 游戏脚本格式说明

## 对话段落
对话段落必须以空行分开,否则会被认为是同一个人说的, 正常是这样的

>    所以只要把她当作小孩子看就立即会生气.不过这也没办法的
    事情,自从妈妈让我照顾好穹之后,我就一直守在她身边了.

    悠：哪里有许多令你怀念的地方呢.

    穹：.........

你可以发现,上面的剧本名字是是用了全角的：里区分名字和内容(上面的对话没有是用立绘所以名字后面没有跟着括号),如果你是用半角
的冒号的话Reitsuki则无法知道哪里是名字哪里是内容,就会把名字一起输出到脚本框里面

##显示立绘
名字后面添加括号,在里面写该角色的立绘编号,例如:
>穹(怒)：.......别把我当成小孩子看!!
另外Reitsuki是支持同时显示多个立绘的,只需要在名字后面以逗号分割就可以了,例如
>穹(笑),一叶(笑)：.......

## 设置标签(label命令)
标签命令为
>@label "标签名"
其中标签名必须在冒号里面, @label后面必须要有一个空格,因为这是Reitsuki调用函数的格式

## 跳转命令(goto命令)
>@goto "标签名"

## if命令 
>@if a > b,"label2"
其中 a > b为javascript的逻辑语句, 这里的意思为如果 a > b 的话那么就跳转到label2哪里
注意Reitsuki没有else语句的

##定义javaScript语句块
>@{  javascript内容  }@
可以多行 但是必须以 @{开始 并且以}@结束
其中 global 对象为全局变量,在JS块外面的命令只能访问global对象的内容

## 调用自定义函数
例如在 JS语句块里声明了以下这个函数
>@{
 global.log = function(str){
    console.log(str);
  };
}@

就可以在下面是用 
>@log "helloworld"

调用.多个参数可以是用冒号分隔.
如果是想在调用语句里是用变量的话
>@{ global.text = "hello"; }@
@log global.text

## 在对话中是用变量

>穹(怒)：.......$text是个大笨蛋,别把我当成小孩子看!!

就会变成
>穹(怒)：.......hello是个大笨蛋,别把我当成小孩子看!!

就是$号后面跟着在global里的成员名

## 设置背景(setBG命令)
>@setBG "bg1",1000
背景文件夹为bg,文件格式为jpg.
上面的意思为 显示bg1.jog为背景,且渐变速度为1000毫秒
其中渐变速度为可选

## 以纯色作为背景(setBGColor命令)
>@setBGColor "#000",1000

"#000" 为颜色编码
1000为渐变速度 可选

## 播放BGM,语音,其他声音
对应文件夹为 bgm,voice,sound
现在只支持ogg文件格式,未来会更具浏览器的情况自动识别文件格式
>@setBGM "bgm"
@setVoice "v01"
@setSound "sound"

## 选择语句(selectBox命令)
@selectBox "item1","如果Item1被选择的话就跳去这个label","item2","如果Item2被选择的话就跳去这个label"

#环境设置命令 (@set)
例如设置 脚本显示框的背景
> @set "sb_BackgroundImage","image","img/scrpitboxbk.jpg",0.7
 
其中"sb_BackgroundImage" 表示要设置的环境函数,
这里的sb是ScriptDispBoxComponent 的缩写,Reitsuki当前只支持2中缩写,另外一种是SelectBoxComponent缩写sel
后面的"_"表示组件名与setter的分界,后后面的是setter方法的名字 BackgroundImage
其他为要设置的参数

## Reitsuki 常用的环境设置参数
> @set "sb_BackgroundImage","背景类型,image为图像color为纯色","图像的url/颜色编码",透明度

> @set "sb_TextSpeed" 字符现实速度单位为毫秒

> @set "sb_TextFontFamily" "字体名称"

> @set "sb_TextColor" "字体颜色"

> @set "sb_TextSize" 字体大小

> @set "sel_TextSize" 选项的字体大小

> @set "sel_TextFontFamily" "选项的字体名字"

> @set "sel_TextColor" "选项的字体颜色"

> @set "sel_TextAlign" "选项的字体对其方式,left,center,right"

以上是比较常用的组件环境设置方法
想要设置其他组件的话 必须带上完整名字例如想设置BGComponent的A属性
>@set "BG_A" 1

## 显示对话框(dailog)
@dailog "titleDailog",callback
意思是显示html element id为titleDailog 的div,在这个dailog关闭的时候调用callback里的函数
对话框必须关闭后才会继续执行下一句语句
在对话框关闭后必须执行closeDialog方法通知Reitsuki 这个对话框已经关闭了并返回了一些东西
另外callback参数不是必须的

对话框关闭事件例子
    document.getElementById("start_game").addEventListener("click",function(){
            gal.closeDialog("startGame");
        },false);


#Reitsuki的API
## 储存
Reitsuki.init.prototype.save = function(name,isAutoSave);
其中name为存档的名字,isAutoSave 是否为自动存档 ,这2个参数都可选
默认为 存档名字为当前时间的字符串
调用例子
gal.save()

##读取 
Reitsuki.init.prototype.load = function(name);
name为存档名字,可选,末日为自动存档

调用例子
gal.load()


## 立即显示对话框
Reitsuki.init.prototype.showDailog = function(id);
id为html element对象的id
调用例子 
gal.showDailog("dailog");

## 注册右键菜单
Reitsuki.init.prototype.registerRightClickDailog = function(id);
id为html element对象的id
调用例子 
gal.registerRightClickDailog("dailog");

## 查询是否有存档
Reitsuki.init.prototype.hasSaveData();

调用例子
if(gal.hasSaveData()){
  //do something..
}
