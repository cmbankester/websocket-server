"use strict";
const WebSocketConnectionHandler = require('websocket').server;
const R = require('ramda');
const url = require('url');

function log(arg) {
  console.log(`${new Date()} ${arg}`);
}

function parseMessage(string_message) {
  try {
    const parsed = JSON.parse(string_message);
    return parsed;
  } catch (e) {
    return false;
  }
}

class TimenatorClient {
  constructor(connection) {
    this.connection = connection;
    this.client_id = null;
    connection.on('message', message => {
      if (message.type === 'utf8') {
        // TODO: Parse message and proxy to message handlers
        log(`Peer ${connection.remoteAddress} sent string message:\n\t${message.utf8Data}`);
        const fromClient = parseMessage(message.utf8Data);
        if (fromClient) {
          if (fromClient.name === 'connect') {
            if (fromClient.type === "as-user") {
              this.client_id = fromClient.data.connectwiseUsername;
              log(`Peer ${connection.remoteAddress} connected with client id: ${this.client_id}`);
              this.send(`Message received: ${message.utf8Data}`);
            }
          }
        } else {
          this.send("Could not parse");
        }
      } else {
        this.send("Could not parse");
      }
    });

    // When the connection closes, log the provided reason
    connection.on('close', (reasonCode, description) => {
      log(`Peer ${connection.remoteAddress} disconnected; Reason:\n\t${description}`);
    });

    // Simply log all errors
    connection.on('error', log.bind(console));
  }

  // Emits `message` on the websocket connection. If `message` is a string,
  // the emitted message will be a stringified json object {name: `message`}.
  // Otherwise the emitted message will be the stringified json object `message`
  send(message) {
    if (typeof message === "string") {
      this.connection.sendUTF(JSON.stringify({name: message}));
    } else {
      this.connection.sendUTF(JSON.stringify(message));
    }
  }
}

const _server_connected_clients_map = new WeakMap();

module.exports = class WebSocketServer {
  // Attaches a websocket connection handler to the provided node http server
  constructor(httpServer) {
    _server_connected_clients_map.set(this, new Set());
    const connection_handler = new WebSocketConnectionHandler({
      httpServer
    });
    connection_handler.on('request', request => {
      if (!R.contains(WebSocketServer.subProtocol, request.requestedProtocols)) {
        request.reject(400, "Request does not have the correct sub protocol");
        return;
      }

      // Accepting the request will fire the 'connect' event (see below)
      request.accept(WebSocketServer.subProtocol, request.origin);
    });
    connection_handler.on('connect', connection => {
      log(`New websocket connection established: ${connection.remoteAddress}`);
      const client = new TimenatorClient(connection);
      this.connectedClients.add(client);
      const len = this.connectedClients.size;
      log(`There ${len === 1 ? 'is' : 'are'} now ${len} connected client${len === 1 ? '' : 's'}.`);
      connection.on('close', () => {
        this.connectedClients.delete(client);
        const len = this.connectedClients.size;
        log(`There ${len === 1 ? 'is' : 'are'} now ${len} connected client${len === 1 ? '' : 's'}.`);
      });
    });
  }

  // Sends `message` to every client with the provided client_id that is
  // connected to this server
  broadcastTo(client_id, message) {
    this.connectedClients.forEach(client => {
      if (client.client_id === client_id) {
        client.send(message);
      }
    });
  }

  // Sends `message` to every client connected to this server
  broadcast(message) {
    this.connectedClients.forEach(client => client.send(message));
  }

  // All clients connected to the server
  get connectedClients(){
    return _server_connected_clients_map.get(this);
  }

  // The subprotocol (http://tools.ietf.org/html/rfc6455#section-1.9)
  static get subProtocol() {
    return "json.api.timenator";
  }
}
