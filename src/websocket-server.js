"use strict";
const WebSocketConnectionHandler = require('websocket').server;
const R = require('ramda');
const url = require('url');
const httpServer = require('./http-server');
const SUB_PROTOCOL = "json.api.timenator";
const connected_clients = new Set();
const TimenatorClient = require('./timenator-client');

function log(arg) {
  console.log(`${new Date()} ${arg}`);
}

function parseJson(string_message) {
  try {
    const parsed = JSON.parse(string_message);
    return parsed;
  } catch (e) {
    return false;
  }
}

const connection_handler = new WebSocketConnectionHandler({
  httpServer
});

connection_handler.on('request', request => {
  if (!R.contains(SUB_PROTOCOL, request.requestedProtocols)) {
    request.reject(400, "Request does not have the correct sub protocol");
    return;
  }

  // Accepting the request will fire the 'connect' event (see below)
  request.accept(SUB_PROTOCOL, request.origin);
});
connection_handler.on('connect', connection => {
  const client = new TimenatorClient(connection);
  log(`New websocket connection established: ${client.remote_address}`);
  connected_clients.add(client);
  const len = connected_clients.size;
  log(`There ${len === 1 ? 'is' : 'are'} now ${len} connected client${len === 1 ? '' : 's'}.`);
  connection.on('close', () => {
    connected_clients.delete(client);
    const len = connected_clients.size;
    log(`There ${len === 1 ? 'is' : 'are'} now ${len} connected client${len === 1 ? '' : 's'}.`);
  });
});

module.exports = {
  // Sends `message` to every client with the provided client_id that is
  // connected to this server
  broadcastTo(client_id, message) {
    connected_clients.forEach(client => {
      if (client.client_id === client_id) {
        client.send(message);
      }
    });
  },

  // Sends `message` to every client connected to this server
  broadcast(message) {
    connected_clients.forEach(client => client.send(message));
  }
};
