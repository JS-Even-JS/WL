;$(function(){
	/*loginCheck()方法用于登录检查
	  首先通过ajax将用户输入的用户名发送给服务器,如果服务器返回-1表示这个用户名在服务器中不存在,则验证通过可以登录
	*/
	function loginCheck(){
					/*通过ajax向服务器发送请求,检测用户名是否已经存在*/
					$.get("/check",{"userName":$("#userName").val().trim()},function(data){
							if(data.trim()=="-1"){
								$("#loginForm").submit();//验证通过可以登录
							}else{
								$("#userInfo").html("用户名存在!");//用户名存在无法登录,并提示用户名存在;
								return false;
							}
					})			
				}
	/*给登录按钮添加click事件
	  如果用户名不为空的字符串,则进行用户名校验,校验合法则进行登录
	*/
	$("#loginBtn").click(function(e){
		if($("#userName").val().trim()==""){
			return false;
		}
		loginCheck();
	});
	/*给用户名输入框添加一个keypress事件
	  当用户输入完成按enter键后,自动触发登录按钮的click事件进行登录
	*/
	$("#userName").keypress(function(e){
		if(e.keyCode=="13"){
			if($("#userName").val().trim()==""){
				return false;
			}else{
				$("#loginBtn").trigger("click");
			}			
		}
	});
	/*keypress()事件结束*/
});	