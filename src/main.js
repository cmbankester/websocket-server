"use strict";
const app = require('./app');
const httpServer = require('./http-server');
const connectwiseCallbackReceiver = require('./connectwise-callback-receiver');

app.use(connectwiseCallbackReceiver.routes());
app.use(connectwiseCallbackReceiver.allowedMethods());

httpServer.listen(1337, () => {
  console.log(`${new Date()} Server is listening on port 1337`);
});
