"use strict";
const util = require('util');
const Router = require('koa-router');
const parseHttpRequestBody = require('koa-body');

const router = new Router({
  prefix: '/producer'
});

function parseJson(string_message) {
  try {
    const parsed = JSON.parse(string_message);
    return parsed;
  } catch (e) {
    return false;
  }
}

class CallbackMessage {
  constructor(fromConnectwise) {
    let ret;
    if (typeof fromConnectwise === "string") {
      ret = parseJson(fromConnectwise) || {};
    } else {
      ret = fromConnectwise;
    }
    this.FromUrl = ret.FromUrl; // string
    this.CompanyId = ret.CompanyId; // string
    this.MemberId = ret.MemberId; // string
    this.Action = ret.Action; // string enum {"updated", "added", "deleted"}
    this.Type = ret.Type; // string enum {"ticket", "activity", "time"}
    this.ID = ret.ID; // integer
    this.Entity = parseJson(ret.Entity) || ret.Entity; // json object
  }
}

router.use(parseHttpRequestBody());

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
