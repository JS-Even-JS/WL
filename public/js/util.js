//这是更新用户信息的方法
function updateUsers(users){
	$("#users-list").empty();	
	$("#users-list").append($("<li><img src='./images/headIcons/0.jpg'><span></span><a title='所有人'>所有人</a></li>"));
	for(var i=0;i<users.length;i++){
		var currentUser = users[i];
		if(currentUser.userName==user.userName){
			continue;
		}else{
			$("#users-list").append($("<li><img src='./images/headIcons/"+currentUser.headIconId+".jpg'><span></span><a title="+currentUser.userName+">"+currentUser.userName+"</a></li>"));
		}
	}
}
//这是添加聊天信息的方法
function appendMessage(userName,publicMessage){
		var isMe = publicMessage.from.userName==user.userName?"me":"";
		if(publicMessage.type=="text"){
			var html = "";
			html += '<div class="chatItem">';
			html += 	'<div class="chatInfoBox '+isMe+'">';
			html +=   	 	'<div class="userHeadIcon '+isMe+'"><img src="./images/headIcons/'+publicMessage.from.headIconId+'.jpg"></div>';
			html +=     	'<div class="chatInfo '+isMe+'">';
			html += 		'<div class="chatTime '+isMe+'">';
			html +=				publicMessage.from.userName+'('+publicMessage.time+')';
			html += 		'</div>';
			html += 		'<div class="chatContent '+isMe+'">';
			html += 			replaceEmoji(publicMessage.content);
			html += 		'</div>';
			html += 		'<div class="arrow '+isMe+'"></div>';
			html += 	'</div>';
			html +=	'</div>';
			$("#chatArea").append(html);
		}
		if(publicMessage.type=="image"){
			var html = "";
			html += '<div class="chatItem">';
			html += 	'<div class="chatInfoBox '+isMe+'">';
			html +=   	 	'<div class="userHeadIcon '+isMe+'"><img src="./images/headIcons/'+publicMessage.from.headIconId+'.jpg"></div>';
			html +=     	'<div class="chatInfo '+isMe+'">';
			html += 		'<div class="chatTime '+isMe+'">';
			html +=				publicMessage.from.userName+'('+publicMessage.time+')';
			html += 		'</div>';
			html += 		'<div class="chatContent hasImage '+isMe+'">';
			html += 			'<img src="'+replaceEmoji(publicMessage.content)+'"/>';
			html += 		'</div>';
			html += 		'<div class="arrow '+isMe+'"></div>';
			html += 	'</div>';
			html +=	'</div>';
			$("#chatArea").append(html);
		}
	//让滚动条滚动到聊天区域的底部
	$("#chatArea").scrollTop($("#chatArea").get(0).scrollHeight);
}
//改变聊天对象的方法同时发送ajax获取聊天内容
function getChatObj(e){
	var chatObj = "";
	if(e!=null && e.target.tagName.toLowerCase() != "a"){
		var aObj = $(e.target).find("a");
		chatObj=aObj.html();
		messageCount = messageCount - parseInt($(e.target).find("span").html()==""?0:$(e.target).find("span").html());
		$(e.target).find("span").html("");
		$(e.target).find("span").addClass("isRead");
	}else{
		chatObj = $(e.target).html();
		messageCount = messageCount - parseInt($(e.target).prev().html()==""?0:$(e.target).prev().html()); 
		$(e.target).prev().html("");
		$(e.target).prev().addClass("isRead");
	}
	$(".count").html(messageCount);
	return chatObj;
}
/*changeUser()方法的作用就是获取到聊天对象,并通过聊天对象获取到聊天记录并显示*/
function changeUser(e,chat){
	var chatObj ="";
	if(e!=null){
		chatObj = getChatObj(e);
	}else{
		chatObj = chat;
	}
	$("#chatObj").html(chatObj);
	getChatContent({"from":user.userName,"to":chatObj});
	//让输入框自动获取焦点
	setTimeout(function(){
		$("#newMsg").focus();
	},1000);
}
//获取聊天内容并显示到聊天窗口中的方法
function getChatContent(options){
	$.get("/getChatContent",options,function(messages){
		console.log(messages);
		if(messages=="-1"){
			$("#chatArea").empty();
			return;
		}else{
			$("#chatArea").empty();
			for(var i=0;i<messages.length;i++){
				appendMessage(user.userName,messages[i]);
			}
		}
	})
};
//转换表情包内容
function replaceEmoji(msg){
	var regExp = new RegExp("\\[emoji:(\\d+)\\]","ig");
	var finalMessage = msg.replace(regExp,function(matchStr,emojiIndex){
		return '<img class="emoji" src="./images/emoji/'+emojiIndex+'.gif"/>';
	});
	return finalMessage;
}
//刷新页面获取服务器端保存的界面状态并更新view
function updateView(getUsreInfoPromise){
	//当用户登录后或者刷新页面,通过ajax获取用户界面,显示哪个界面,如果用户处于聊天界面则还要获取到聊天对象,这些都保存到了session中
	$.get("/getView",function(result){//用户第一次登录isUserList和chatObj都是undefined,因为还没有保存,此时直接显示用户列表界面
		isUserList = result.isUserList;//获取用户处于哪个界面
		var chatObj = result.chatObj;//获取用户的聊天对象
		getUsreInfoPromise.then(function(data){
			changeUser(null,chatObj);//changeUser()方法就是找到对应的聊天对象设置到聊天窗口中,同时获取聊天记录显示到聊天窗口中
			if(isUserList!=undefined && isUserList.trim()=="false"){//如果用户当前处于聊天界面则隐藏用户列表界面显示聊天界面
				$("#users").fadeOut();
				$("#chatWindow").fadeIn();
			}else{//如果用户当前处于用户列表界面则显示用户列表界面隐藏聊天界面
				$("#users").fadeIn();
				$("#chatWindow").fadeOut();
			}
		});						
	});
}