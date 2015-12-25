"use strict";
const app = require('./app');
const util = require('util');
const Router = require('koa-router');
const CallbackMessage = require('./callback-message');
const parseHttpRequestBody = require('koa-body');
const webSocketServer = require('./websocket-server');

const router = new Router({
  prefix: '/producer'
});

function log(arg) {
  console.log(`${new Date()} ${arg}`);
}

function *parseCallback(next) {
  // TODO: validate callback message & parse json payload
  // (see: https://gitlab.immense.net/timenator/timenator-api/blob/master/src/TimenatorAPI.SharedDomain/ConnectwiseObjects/CallbackMessage.cs)
  // IDEA: parse request body into a CallbackMessage object?
  this.callback_message = new CallbackMessage(this.request.body);
  yield next;
}

function parseJson(string_message) {
  try {
    const parsed = JSON.parse(string_message);
    return parsed;
  } catch (e) {
    return false;
  }
}

router.use(parseHttpRequestBody());

router.post('/activity-event', parseCallback, function *(next) {
  log(`Activity event callback received from Connectwise; Message:\n${util.inspect(this.callback_message)}`);
  this.status = 200;
});

router.post('/ticket-event:ticket_id', parseCallback, function *(next) {
  log(`Ticket event callback received from Connectwise; Message:\n${util.inspect(this.callback_message)}`);
  this.status = 200;
});

router.post('/time-entry-event', parseCallback, function *(next) {
  log(`Time entry event callback received from Connectwise; Message:\n${util.inspect(this.callback_message)}`);
  this.status = 200;
});

module.exports = router;
