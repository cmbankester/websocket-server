"use strict";
const app = require('http').createServer(handler);
const WebSocketServer = require('./lib/api/websocket-server');

const webSocketServer = new WebSocketServer(app);

function handler(req, res) {
  res.writeHead(200);
  res.end();
}

app.listen(1337, () => {
  console.log(`${new Date()} Server is listening on port 1337`);
});
