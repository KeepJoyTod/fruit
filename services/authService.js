const { callCloud } = require("../utils/request");
const API = require("../constants/api");

function merchantLogin() {
  return callCloud(API.MERCHANT_LOGIN);
}

function acceptInvite(inviteCode) {
  return callCloud(API.ACCEPT_INVITE, {
    inviteCode
  });
}

module.exports = {
  merchantLogin,
  acceptInvite
};
