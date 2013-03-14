
var game;
$(document).ready(function(){
	game = new Reitsuki("game",{
		script:$("#sora").html(),
		width:800,
		height:600
	});
	
	game.start();
});