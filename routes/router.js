var fs = require("fs");
var util = require("../util/util.js");
var users = [];//保存用户列表
var dbUrl = process.cwd()+"/db/chatContent/";
//检测用户名是否存在的路由
exports.showCheck=function(req,res,next){
	//获取到用户登录界面提交过来的用户名
	var userName = req.query.userName.trim();
	console.log("check用户名是否存在？");
	for(var i=0;i<users.length;i++){//遍历用户列表看是否存在相同的用户名
		if(users[i].userName.trim()==userName.trim()){
			res.send("1");//返回1表示用户名存在
			return;//结束for循环
		}
	}
	res.send("-1");//表示用户不存在可以提交了
}
//将用户对象和用户列表保存到session对象中并跳转到聊天界面的路由
exports.showChat=function(req,res,next){
	console.log("执行showChat路由,执行到这里表示用户已经可以登录了!");
	console.log(req.query.userName);
	req.session.userName=req.query.userName;//将用户的用户名保存到session对象中;
	var user = {};
	user.userName = req.session.userName;
	user.headIconId = util.createRandom(1,57);
	users.push(user);
	req.session.user = user;//将用户对象保存到session中
	req.session.users = users;//将用户列表保存到session中
	req.session.login = true;//true表示是用户第一次登录
	res.redirect("/chat.html");
}
//返回用户名
exports.showUserInfo = function(req,res,next){
	console.log("执行showUserName路由");
	console.log(req.session.user);
	console.log(req.session);
	console.log("是否是第一次登录:"+req.session.login);
	var result = {};
	if(req.session.login){//如果是第一次登录,那么返回-1,并且将login变为false,之后就不是第一次登录了
		req.session.login=false;
		result.user = req.session.user;
		result.statu = "-1";
		res.send(result);
		return;
	}else{
		result.user = req.session.user;
		result.statu = "1";
		res.send(result);//不是第一次登录则返回用户对象
	}
}
//返回用户列表users
exports.showUserList = function(req,res,next){
	console.log("用户刷新页面并返回用户列表!");
	console.log("用户列表为:");
	console.log(users);
	res.send(users);
}
//保存用户界面
exports.showSaveView = function(req,res,next){
	console.log("进入保存用户界面路由!");
	req.session.isUserList = req.query.isUserList;
	req.session.chatObj = req.query.chatObj;
	res.send("保存用户界面成功!");
}
exports.showGetView = function(req,res,next){
	var result = {};
	result.isUserList = req.session.isUserList;
	result.chatObj = req.session.chatObj;
	res.send(result);
}
//返回聊天内容
exports.showChatContent = function(req,res,next){
	console.log("执行showChatContent路由!");
	//获取聊天用户
	var from = req.query.from;
	var to = req.query.to;
	console.log("from:"+from);
	console.log("to:"+to);
	if(to=="所有人"){
		try{
			var publicMessagesString = fs.readFileSync(dbUrl+"all.txt").toString();
		}catch(e){
			res.send("-1");		//文件不存在
			return;	
		}
		var publicMessagesJsonString="["+publicMessagesString.slice(0,publicMessagesString.length-1)+"]";
		var publicMessages = JSON.parse(publicMessagesJsonString);
		res.json(publicMessages);
	}else{
		//私聊信息
		try{
			var fromtoMessageString = fs.readFileSync(dbUrl+"/"+from+to+".txt").toString();
		}catch(e){
			fromtoMessageString="";
		}
		try{
			var tofromMessageString = fs.readFileSync(dbUrl+"/"+to+from+".txt").toString();
		}catch(e){
			tofromMessageString="";
		}
		if(fromtoMessageString==tofromMessageString){
			res.send("-1");
			return;
		}
		var privateMessageJsonString ="";
		//如果私聊对象没有回过信息,则其中一个值为空字符串,这个时候就两边都进行去除逗号操作,防止多出一个逗号,导致JSON格式不对,空字符串进行去除逗号处理还是原值;
		if(fromtoMessageString==""||tofromMessageString==""){
			privateMessageJsonString = "["+fromtoMessageString.slice(0,fromtoMessageString.length-1)+tofromMessageString.slice(0,tofromMessageString.length-1)+"]";
		}else{
			privateMessageJsonString ="["+fromtoMessageString+tofromMessageString.slice(0,tofromMessageString.length-1)+"]";
		}
		console.log(privateMessageJsonString);
		var privateMessage = JSON.parse(privateMessageJsonString);
		console.log("私聊信息为:");
		console.log(privateMessage);
		privateMessage = util.sortContent(privateMessage,"seconds");
		console.log("排序后:");
		console.log(privateMessage);
		res.json(privateMessage);
	}
}
exports.users =users;
