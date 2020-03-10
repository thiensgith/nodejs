/**
 * Config server
 */

const host = 'localhost';
const port = 3000;


const express = require('express');
const mysql = require('mysql');

const app = express();
const db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	database: 'node',
});


const server = app.listen(port, host,function() {
    console.log('server running on port ' + port);
});
db.connect(function (err) {
	if (err) console.log(err);
	else console.log('Database connection successful!')
})


const io = require('socket.io')(server);

var notes = [];
var isInitNotes = false;

var socketCount = 0;

var users = [];

var conversations = [];
var isInitConversations = false;

var messages = [];
var isInitMessages = false;

var auth = false;

io.on('connection', function(socket) {
    
	socketCount++;

	io.emit('user connected', socketCount)

	socket.on('disconnect', function() {
        // Decrease the socket count on a disconnect, emit
        socketCount--
        io.sockets.emit('users disconnected', socketCount)
    })

	socket.on('login', function(email) {

		db.query('SELECT * FROM users WHERE email = ?', email)
			.on('error', function(err) {
				io.emit('login_reponse', err);
			})
			.on('result', function(data) {
				auth = true;
				users.push(email);
				console.log(email + 'joined! Now is' + users.length + ' online');
			})
			.on('end', function(){
				if (auth) io.emit('login_reponse', email);
			});

	});

    socket.on('JOIN', function(data) {
    	io.emit('JOINED',data)
    });
    socket.on('SEND_MESSAGE', function(data) {
        io.emit('MESSAGE', data)
    });

    socket.on('new note', function(note){
        // New note added, push to all sockets and insert into db
        notes.push(note)
        io.sockets.emit('new note', note)
        // Use node's db injection format to filter incoming data
        db.query('INSERT INTO notes (note) VALUES (?)', note)
    })
    socket.on('get', function(){
    	if (! isInitNotes) {
        // Initial app start, run db query
        db.query('SELECT * FROM notes')
            .on('result', function(data){
                // Push results onto the notes array
                notes.push(data)
            })
            .on('end', function(){
                // Only emit notes after query has been completed
                socket.emit('initial notes', notes)
            })
 
        isInitNotes = true
	    } else {
	        // Initial notes already exist, send out
	        socket.emit('initial notes', notes)
	    }
    });
    
});