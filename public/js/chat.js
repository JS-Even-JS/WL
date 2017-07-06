//定义一个WL构造函数
function WL(){
	this.socket = null;
}
WL.prototype={
	init:function(){
		var that = this;//持有对当前WL对象的引用方便内部函数可以获取到WL对象;
		this.socket = io.connect();//客户端连接服务器之后会返回一个socket对象;
		var getUsreInfoPromise = new Promise(function(resolve,reject){//当加载当前页面即chat.html页面的时候
			$.get("/getUserInfo",function(result){//首先通过ajax发送请求获取到当前登录的user对象以及登录状态
				resolve(result);
			})
		});
		/*当加载当前页面的时候,有可能用户还没有登录,则直接返回登录界面
		  有可能是用户第一次登录,则发送login事件,服务器向所有用户推送最新的用户列表信息
		  有可能是用户已经登录在刷新页面,则通过ajax获取最新的用户列表并显示
		*/
		getUsreInfoPromise.then(function(result){
			user=result.user;//拿到用户对象并保存到全局的user变量中
			if(user==undefined){//如果用户对象为undefined,说明用户还没有登录过,所以直接返回到index.html进行登录
				location.href="/";
			}
			if(result.statu=="-1"){//如果用户的登录状态为-1表示用户是第一次登录,则通过socket发起login事件并且将当前用户发送给服务器
				that.socket.emit("login",result.user);
			}else{//result.statu!=-1说明用户已经登录过了,此时表示用户在刷新页面,所以直接通过ajax获取用户列表信息
				$.get("/getUserList",function(result){
					users = result;//将用户列表保存到全局的users数组中
					updateUsers(users);//并调用util.js中的updateUsers()方法进行更新和展示用户列表
				});
			}
			//Promise执行then()说明已经拿到了当前用户对象,然后通过socket添加监听服务器发送给自己信息的事件to+user.userName，处理私聊信息的接收
			that.socket.on("to"+user.userName,function(privateMessage){
				//在进行私聊的时候，消息发送者的聊天对象肯定是消息的接收者,所以如果消息对象的接收者正好是聊天对象,那么直接将信息添加到聊天窗口中
				//但是消息接收者的聊天对象不一定是消息的发送者,如果消息接收者的聊天对象正好是消息发送者,说明消息接收者正好在与消息发送者在聊天，则直接将消息添加到聊天窗口中
				if(privateMessage.from.userName==$("#chatObj").html()||privateMessage.to==$("#chatObj").html()){
					appendMessage(user.userName,privateMessage);
				}else{//如果消息的接收者的聊天对象不是消息的发送者,说明消息接收者不是正在与消息发送者聊天，那么就把这条消息当作是一条未读消息,并通知消息接收者;
					that.doUnReadMessage(privateMessage);//处理未读消息部分
				}
			});
		});
		//如果用户是第一次登录,那么服务器会将最新的用户列表推送给所有用户,每个用户接收到最新的用户列表后开始更新用户列表
		this.socket.on("newerLogin",function(users){
			updateUsers(users);
		});
		//用户刷新界面后及时更新view
		updateView(getUsreInfoPromise);
		//监听发送给所有人的事件toAll,处理群聊信息
		that.socket.on("toAll",function(publicMessage){
			if($("#chatObj").html().trim()=="所有人"){//如果用户正在进行群聊则直接将群聊信息添加到聊天窗口中
				appendMessage(user.userName,publicMessage);
			}else{//如果不是正在群聊则被当作是未读消息处理
				that.doUnReadMessage(publicMessage);
			}
		});
		//当有新用户登录,则会在群聊中添加一条登录提示信息,这是一条临时消息,不会保存到聊天存储文件中
		this.socket.on("loginTip",function(user){
			if($("#chatObj").html()=="所有人"){
				var html="";
				html+='<div class="loginTipBox"><div class="loginTip">'+user.userName+'加入了群聊</div></div>';
				$("#chatArea").append(html);
				$("#chatArea").scrollTop($("#chatArea").get(0).scrollHeight);
			}
		});
		//给发送按钮添加监听事件
		$("#sendMsg").click(function(e){
			var content = $("#newMsg").text().trim();//获取聊天内容
			if(content!=""){//如果聊天内容不为空的字符串,则向服务器推送一个newMsg事件
				that.socket.emit("newMsg",{"from":user,"to":$("#chatObj").html(),"content":content,"type":"text"});
				$("#newMsg").text("");//清空输入框中的内容;
			}
		});
		//通过代理的方式给用户列表添加click事件,点击某个用户后进入聊天内容,同时保存聊天对象和界面信息到session中
		$("#users-list").delegate("li","click",function(e){
			changeUser(e);//当点击用户列表中的某一个用户后,改变聊天对象并获取到相应的聊天记录同时显示到聊天窗口中
			isUserList=false;//表示当前处于聊天界面
			$.get("/saveView",{"isUserList":isUserList,chatObj:getChatObj(e)},function(result){//将当前界面信息和聊天对象保存到session中,以便刷新后能及时恢复
			});
			$("#users").fadeOut();//隐藏用户列表界面
			$("#chatWindow").fadeIn();//显示聊天窗口界面
		});
		//初始化表情包
		this.initEmoji();
		//点击表情按钮显示和隐藏表情
		$("#smile").click(function(e){
			var emojiObj = $("#emoji");
			if(emojiObj.css("display")=="none"){//如果表情对象是隐藏的则显示
				emojiObj.show();
			}else{//如果表情对象处于显示状态则将其隐藏
				emojiObj.hide();
			}
		});
		//将表情符号添加到信息输入框中
		$("#emojiWrapper").click(function(e){
			var target = e.target;
			if(target.tagName.toLowerCase()=="img"){
				$("#newMsg").focus();
				$("#newMsg").html($("#newMsg").html()+"[emoji:"+target.title+"]");
			}
			$("#smile").trigger("click");
		});
		//添加发送图片事件,将图片读取为base64编码格式可以直接将图片以字符串的形式存储起来
		$("#chooseImg").change(function(){
			if(this.files.length!=0){
				var file = this.files[0];
			}
			var reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload=function(e){
         		this.value="";
         		that.socket.emit("newMsg",{"from":user,"to":$("#chatObj").html(),"content":e.target.result,"type":"image"});
         	}
		});
		//给返回按钮添加click事件,点击后返回到用户列表
		$("#back").click(function(e){
			isUserList=true;
			$.get("/saveView",{"isUserList":isUserList},function(result){//这里只需要保存用户界面状态,因为没有聊天对象所以不需要保存聊天对象
			});
			//返回后清空聊天对象,以便返回后聊天对象为空才能接收未读消息
			$("#chatObj").html("");
			$("#chatWindow").fadeOut();
			$("#users").fadeIn();
		});
		//给发送按钮添加键盘事件,按Enter键发送
		$("#newMsg").keypress(function(e){
			if(($(this).text().trim()!="")&&(e.keyCode==13)){
				$("#sendMsg").trigger("click");//当用户按Enter键后自动触发发送按钮的click事件
			}
		});
		//代理聊天内容区中所有图片的click事件,当点击图片的时候全屏显示其大图
		$("#chatArea").delegate(".chatContent","click",function(e){
			if($(this).find("img").length!=0){//如果聊天内容中有图片,则找到其中的图片并获取到图片的src
				var imageUrl = $(this).find("img").attr("src");
				$(".shade").show();//显示图片遮罩层
				$(".shade").find("img").attr("src",imageUrl);//并将遮罩层图片的src设置为点击的图片的src
			}
		});
		//点击图片遮罩层隐藏遮罩层;
		$(".shade").click(function(e){
			$(this).hide();
		});
	},//init()方法结束
	initEmoji:function(){
		//创建一个文档片段,将所有的表情添加到表情容器中
		var docFragment = document.createDocumentFragment();
		for(i=0;i<=92;i++){
			var imgElement = document.createElement("img");
			imgElement.src = "./images/emoji/"+i+".gif";
			imgElement.title=i;
			docFragment.appendChild(imgElement);
		}
		$("#emojiWrapper").append(docFragment);
	},
	doUnReadMessage:function(message){
		messageCount++;//如果有未读消息,则让未读消息条数++;
		$(".count").html(messageCount);//更新未读消息条数
		var lis = $("#users").find("li");//获取到用户列表中的所有li元素对象
		//处理发送给所有人的未读消息
		var spanJqObj =null;
		if(message.to=="所有人"){//如果是群聊信息
						spanJqObj = $(lis.get(0)).find("span");//则直接拿到所有人即第一个li元素所在的span对象
					}else{//如果是私聊信息则进行遍历所有用户,找到消息发送者所在的span元素对象
			for(var i=0;i<lis.length;i++){//遍历每一个li元素
				var aJqObj = $(lis[i]).find("a");//找到li元素中的a元素对象
				if(aJqObj.html()==message.from.userName){//找到消息发送者
					spanJqObj = $(lis[i]).find("span");//获取到消息发送者的所在的span对象
				}
			}
		}
		if(spanJqObj.html().trim()==""){
			spanJqObj.html(1);
			spanJqObj.addClass("unRead");
			spanJqObj.removeClass("isRead");
		}else{
			spanJqObj.html(parseInt(spanJqObj.html().trim())+1);
		}
	}
}