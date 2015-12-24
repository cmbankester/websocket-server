const WebSocketServer = require('websocket').server;
const url = require('url');

const SUBPROTOCOL = "json.api.timenator";
const connected_clients = [];

function getClientIdFromRequest(request) {
  return url.parse(request.httpRequest.url, true).query.client_id;
}

// Returns false if request doesn't have the timenator subprotocol or if the
// request doesn't have the client_id query string
function isValid(request) {
  return Boolean(
    request.requestedProtocols.some(p => p === SUBPROTOCOL) &&
    getClientIdFromRequest(request)
  );
}

// Extracts the client id (i.e. the client_id query string) and
// accepts a websocket upgrade for the given request;
// Returns the connection and client id
function acceptRequest(request) {
  const connection = request.accept(SUBPROTOCOL, request.origin);
  const client_id = getClientIdFromRequest(request);
  connected_clients.push([client_id, connection]);
  const len = connected_clients.length;
  console.log(`There ${len === 1 ? 'is' : 'are'} currently ${len} connected client${len === 1 ? '' : 's'}.`);
  return {
    client_id,
    connection
  };
}

// Returns a function that logs all input to the console
function handleError(connection) {
  return console.log.bind(console);
}

// Returns a function that removes the (handleClose-)provided connection from
// the global list of connected clients and logs the (inner-function-)provided
// close description to the console
function handleClose(connection) {
  return (reasonCode, description) => {
    const connection_index = connected_clients.findIndex(c => c[1] === connection);
    if (connection_index >= 0) {
      connected_clients.splice(connection_index, 1);
    }
    console.log(`${new Date()} Peer ${connection.remoteAddress} disconnected; Reason:\n ${description}`);
    const len = connected_clients.length;
    console.log(`There ${len === 1 ? 'is' : 'are'} currently ${len} connected client${len === 1 ? '' : 's'}.`);
  }
}

// Returns a function that parses the processes a message and proxies it to
// various message-handlers
function handleMessage(connection) {
  return message => {
    if (message.type === 'utf8') {
      // TODO: Parse message and proxy to message handlers
      console.log(`${new Date()} Peer ${connection.remoteAddress} sent string message:\n${message.utf8Data}`);
      connection.sendUTF(`Message received: ${message.utf8Data}`);
    } else if (message.type === 'binary') {
      console.log(`${new Date()} Peer ${connection.remoteAddress} sent binary message.`);
      connection.sendUTF(`Message received: ${message.binaryData}`);
    }
  }
}

module.exports = (httpServer) => {
  const webSocketServer = new WebSocketServer({
    httpServer
  });

  webSocketServer.on('request', request => {
    if (!isValid(request)) {
      request.reject();
      return;
    }
    const acceptedRequest = acceptRequest(request);
    const client_id = acceptedRequest.client_id;
    const connection = acceptedRequest.connection
    console.log(`${new Date()} New websocket connection established: ${request.origin}`);
    connection.on('message', handleMessage(connection));
    connection.on('close', handleClose(connection));
    connection.on('error', handleError(connection));
  });
  return webSocketServer;
};
