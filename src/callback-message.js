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
module.exports = class CallbackMessage {
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
};
