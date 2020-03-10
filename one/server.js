var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

server.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});


var listUser = [];
io.on('connection', function(socket){
	console.log("Có người kết nối");

	socket.on('user_login', function(user_name){
		if (listUser.indexOf(user_name) > -1) {
			return;
		}

		listUser.push(user_name);
		socket.user = user_name;

		io.sockets.emit("get_list_user", {data:listUser});
		io.sockets.emit("user_joined", {
			username: socket.user,
			numUsers: listUser.length
		});

		console.log(listUser);
	})

	socket.on('send_message', function(sender, message) {
		var username = '';
		var body = '';
		var type = -1;
		if (sender == socket.user) {
			type = 0;
		}
		else type = 1;
		io.sockets.emit('receiver_message', {
			username: sender,
			body: message,
			type,
			created_at: new Date().toLocaleTimeString()
		});
	});

	socket.on('disconnect', function () {
		if (socket.user != null) {
			let index = listUser.indexOf(socket.user);
			if (index > -1) {
 			 listUser.splice(index, 1);
			}
		console.log(socket.user +" disconnect");
		io.sockets.emit('user_disconnect', {data: socket.user});
		}			
	});
});