var dbUrl = process.cwd()+"/db/chatContent/";
//采用快速排序对聊天内容进行排序的方法
function sortContent(contents,sortName){
	if(contents.length<=1){
		return contents;
	}
	var middleIndex = parseInt(contents.length/2);
	var middleValue = contents.splice(middleIndex,1);
	var left = [];
	var right =[];
	for(var i=0;i<contents.length;i++){
		if(contents[i][sortName]<middleValue[0][sortName]){
			left.push(contents[i]);
		}else{
			right.push(contents[i]);
		}
	}
	return sortContent(left,sortName).concat(middleValue,sortContent(right,sortName));
};
//获取随机数的方法,用于随机给用户设定头像
function createRandom(min,max){
	return Math.floor(Math.random()*(max-min+1)+min);
}
//每次重启服务器将所有的聊天内容清空
function clearChatContent(){
	var exec = require("child_process").exec;
	exec("rm -rf "+dbUrl+"*.txt",function(err,out){
		console.log("聊天内容已经全部被清空!");
	});
};
exports.sortContent=sortContent;
exports.createRandom=createRandom;
exports.clearChatContent=clearChatContent;