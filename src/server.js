const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { ContentType: 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);

let block = {};

const users = [];

const points = {};

const emitBlock = () => {
  let newBlock = {};
  const xPos = Math.floor((Math.random() * (480 - 50)) + 50);
  const yPos = Math.floor((Math.random() * (480 - 50)) + 50);
  const xSize = Math.floor((Math.random() * (200 - 50)) + 50);
  const ySize = Math.floor((Math.random() * (200 - 50)) + 50);
  if (Object.keys(block).length === 0 && block.constructor === Object) {
    newBlock = { x: xPos, y: yPos, width: xSize, height: ySize };
    block = newBlock;
  } else {
    newBlock = block;
  }
  io.sockets.in('room1').emit('createBlock', newBlock);
};


const emitPlayers = () => {
  let data = '';
  users.forEach((element) => {
    data = `${data}<li>${element.name} - ${points[element.name]}</li>`;
  });
  io.sockets.in('room1').emit('clientUpdate', data);
};


const onJoined = (sock) => {
  const socket = sock;
  socket.on('join', (data) => {
    socket.name = data.name;
    users.push(socket);
    socket.join('room1');
    points[socket.name] = 0;
    console.log(`${data.name} joined`);
    emitBlock(socket);
    emitPlayers(socket);
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');
  onJoined(socket);
  socket.on('blockClicked', (name) => {
    points[name]++;
    block = {};
    emitBlock(socket);
    emitPlayers(socket);
  });

  socket.on('disconnect', () => {
    const userInd = users.indexOf(socket.name);
    users.splice(userInd, 1);
    emitPlayers(socket);
    socket.leave('room1');
  });
});

console.log('Websocket server started');
