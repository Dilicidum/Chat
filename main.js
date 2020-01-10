const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const path = require('path'); 

const port = 8080; 

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

let connections = [];
let users = [];
let messages = []; 

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'auth.html')); 
});

app.post('/',urlencodedParser,(req,res)=>{
    MongoClient.connect(url,{ useUnifiedTopology: true },function(err, db) {
        if (err) throw err;
        const dbo = db.db("mydb");
      
        let user = {name:req.params.id,password:req.body};
        dbo.collection("users").insertOne(user, function(err, res) {
          if (err) throw err;

          console.log("1 document inserted");
          db.close();
        });
      }); 
    console.log("body" + req.body);
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:id', function (req, res) {

    if (req.params.id == 'client.js') {
        res.sendFile(path.join(__dirname, 'client.js'));
    }
    else if (req.params.id == 'favicon.ico') {
        res.sendStatus(404); 
    }
    else {
        users.push(req.params.id);
        res.sendFile(path.join(__dirname, 'index.html'));
    }
})

io.on('connection', function (socket) {
    connections.push(socket);
    console.log("user =  " +users);
    console.log('Amount of coonected sockets: ', connections.length);
    
    socket.on('disconnect', function (data) {
 
        var index = connections.indexOf(socket)

        var deletedItem = connections.splice(index, 1);

        users.splice(index, 1);

        io.sockets.emit('users loaded', { users: users })

        console.log('Disconnected: amount of sockets connected' + connections.length);
    });

    socket.on('send message', function (data) {
        messages.push(data);
        io.sockets.emit('chat message', data);
    });

    socket.on('load users', function () {
        console.log(users)
        io.sockets.emit('users loaded', { users: users })
    });

    socket.on('load messages', function () {
        socket.emit('messages loaded', { messages: messages })
    });

    socket.emit('new user', { name: users[users.length - 1] });

}); 

server.listen(port, function () {
    console.log('app running on port ' + port);
})