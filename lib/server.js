"use strict";
const koa = require('koa');
const app = koa();
const server = require('http').createServer(app.callback());
const WebSocketServer = require('./api/websocket-server');

const webSocketServer = new WebSocketServer(server);

app.use(function *(next) {
  // You can broadcast to the websocket server, e.g.:
  // webSocketServer.broadcastTo("foobar", "barbaz"); => to all clients with client_id === "foobar", send "barbaz"
  // webSocketServer.broadcast("foobar"); => to all clients, send "foobar"
  this.body = "foobar";
});

server.listen(1337, () => {
  console.log(`${new Date()} Server is listening on port 1337`);
});
