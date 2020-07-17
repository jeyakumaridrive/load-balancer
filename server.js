const express = require('express');
const app = express();
const redis = require('redis');


//set the template engine ejs
app.set('view engine', 'ejs')

//middlewares
app.use(express.static('public'))


//routes
app.get('/', (req, res) => {
    console.log('coming!')
    res.render('home')
        // res.end(`Hi, PID: ${process.pid}`);
})

// const PORT_LIST = [8000, 8001, 8002];
// const PORT = PORT_LIST[Math.floor(Math.random() * PORT_LIST.length)];

const server = app.listen(process.env.PORT);
//socket.io instantiation
const io = require("socket.io")(server)

console.log(`Server running on ${process.env.PORT} port, PID: ${process.pid}`);

function SessionManager(user) {
    this.sub = redis.createClient();
    this.pub = redis.createClient();

    this.user = user;
}

SessionManager.prototype.subscribe = function(socket) {
    this.sub.on('message', function(channel, message) {
        socket.emit(channel, message);
    });
    var current = this;
    this.sub.on('subscribe', function(channel, count) {
        var joinMessage = JSON.stringify({ action: 'control', user: current.user, msg: ' joined the channel' });
        current.publish(joinMessage);
    });
    this.sub.subscribe('chat');
};

SessionManager.prototype.rejoin = function(socket, message) {
    this.sub.on('message', function(channel, message) {
        socket.emit(channel, message);
    });
    var current = this;
    this.sub.on('subscribe', function(channel, count) {
        var rejoin = JSON.stringify({ action: 'control', user: current.user, msg: ' rejoined the channel' });
        current.publish(rejoin);
        var reply = JSON.stringify({ action: 'message', user: message.user, msg: message.msg });
        current.publish(reply);
    });
    this.sub.subscribe('chat');
};

SessionManager.prototype.unsubscribe = function() {
    this.sub.unsubscribe('chat');
};

SessionManager.prototype.publish = function(message) {
    this.pub.publish('chat', message);
};

SessionManager.prototype.destroyRedis = function() {
    if (this.sub !== null) this.sub.quit();
    if (this.pub !== null) this.pub.quit();
};

io.sockets.on('connection', function(socket) { 
    console.log(socket.id);
    socket.on('chat', function(data) { 
        var msg = JSON.parse(data);
        if (socket.SessionManager === null) {
            socket.SessionManager = new SessionManager(msg.user);
            socket.SessionManager.rejoin(socket, msg);
        } else {
            var reply = JSON.stringify({ action: 'message', user: msg.user, msg: msg.msg });
            socket.SessionManager.publish(reply);
        }
        console.log(data);
    });

    socket.on('join', function(data) {
        var msg = JSON.parse(data);
        socket.SessionManager = new SessionManager(msg.user);
        socket.SessionManager.subscribe(socket);
        console.log(data);
    });

    socket.on('disconnect', function() {
       
        if (socket.SessionManager === null) return;
        // socket.SessionManager.unsubscribe();
        var leaveMessage = JSON.stringify({ action: 'control', user: socket.SessionManager.user, msg: ' left the channel' });
        socket.SessionManager.publish(leaveMessage);
        socket.SessionManager.destroyRedis();
    });
});
