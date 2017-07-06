var express = require("express");
var app = express();
var router = require("./routes/router.js");//处理路由
var server = require('http').createServer(app);//创建http服务器
var io = require("socket.io")(server);//监听sever
var session = require("express-session");//用于处理session
var fs = require("fs");
var sd = require("silly-datetime");//silly-datatime用于格式化日期
var util = require("./util/util.js");
var dbUrl = process.cwd()+"/db/chatContent/";//聊天内容存放路径
console.log("dbUrl:"+dbUrl);
util.clearChatContent();//每次重启服务器的时候清空聊天记录
var sessionMiddleware =session({
    	secret: "keyboard cat",
    	resave: false,
    	saveUninitialized: true
});
//让socket可以获取到session
io.use(function(socket,next) {
     sessionMiddleware(socket.request, socket.request.res, next);
});
app.use(sessionMiddleware);
app.use(express.static(__dirname+"/public"));//对外暴露静态页面充当web容器
app.use("/check",router.showCheck);//处理检查用户名是否已经存在
app.use("/chat",router.showChat);//保存用户对象到session中并跳转到聊天页面
app.get("/getUserInfo",router.showUserInfo);//获取用户登录信息,包括用户对象和是否是第一次登录
app.get("/getUserList",router.showUserList);//获取用户列表信息
app.get("/saveView",router.showSaveView);//保存界面状态
app.get("/getView",router.showGetView);//获取界面状态
app.get("/getChatContent",router.showChatContent);//获取聊天记录
var allSockets={};//保存所有登录的socket
io.on("connection",function(socket){
	console.log("有新用户连接: "+socket.id);
	var session = socket.request.session;
	console.log(session.userName);
	//如果用户刷新了页面那么,就将最新的socket的名字设置为用户名
	if(session.user!=undefined){
		allSockets[session.user.userName]=socket;
		socket.userName = session.user.userName;
	}
	//当用户第一次登录会发生login事件,服务器监听login事件,将最新的用户列表推送给所有用户并发送一个登录提示给所有用户
	socket.on("login",function(user){
		console.log("新用户登录:");
		console.log(user);
		console.log("用户第一次登录,返回用户列表和用户登录提示信息");
		io.emit("loginTip",user);
		io.emit("newerLogin",router.users);
	});
	//当有人向服务器发送新信息
	socket.on("newMsg",function(message){
		console.log(message);
		if(message.to=="所有人"){//如果是给所有人发的则广播给所有人
			message.time = sd.format(new Date(),'YYYY-MM-DD HH:mm:ss');
			message.seconds = new Date().getTime();
			fs.appendFileSync(dbUrl+'all.txt', JSON.stringify(message)+",");//将信息保存到all.txt文件中
			io.emit("toAll",message);
		}
		//私聊信息，将私聊信息分别保存两份,每个人发的单独保存一份，文件名按from+to的形式生成
		if(message.to in allSockets){
			message.time = sd.format(new Date(),'YYYY-MM-DD HH:mm:ss');
			message.seconds = new Date().getTime();
			fs.appendFileSync(dbUrl+message.from.userName+message.to+".txt", JSON.stringify(message)+",");
			//拿到私聊对象的socket并将消息推送给他
			console.log("to:"+allSockets[message.to]);
			allSockets[message.to].emit("to"+message.to,message);//将消息发送给对方
			//同时将消息推送给自己
			console.log("消息来自于:");console.log(message.from);
			allSockets[message.from.userName].emit("to"+message.from.userName,message);//将消息推送给自己
		}
		
	});
});
server.listen(18080);//监听18080端口
