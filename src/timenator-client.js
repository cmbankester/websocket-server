"use strict";
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
module.exports = class TimenatorClient {
  constructor(connection) {
    this.connection = connection;
    this.client_id = null;
    this.remote_address = connection.remoteAddress;
    connection.on('message', message => {
      if (message.type === 'utf8') {
        // TODO: Proxy to message handlers
        log(`Peer ${this.remote_address} sent string message:\n\t${message.utf8Data}`);
        const fromClient = parseJson(message.utf8Data);
        if (fromClient) {
          if (fromClient.name === 'connect') {
            if (fromClient.type === "as-user") {

              // We got a message that looks like:
              // {name: "connect", type: "as-user", data: {connectwiseUsername: "<some-username>"}}
              this.client_id = fromClient.data.connectwiseUsername;
              log(`Peer ${this.remote_address} connected with client id: ${this.client_id}`);
              this.send("connected");
              return;
            }
          }
        }
        this.send({name: "error", data: {message: "Could not parse"}});
      }
    });

    // When the connection closes, log the provided reason
    connection.on('close', (reasonCode, description) => {
      log(`Peer ${this.remote_address} disconnected; Reason:\n\t${description}`);
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
