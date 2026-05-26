const { callCloud } = require("../utils/request");
const API = require("../constants/api");

function listOwners(shopId) {
  return callCloud(API.LIST_OWNERS, {
    shopId
  });
}

function createInvite(shopId) {
  return callCloud(API.CREATE_INVITE, {
    shopId
  });
}

function removeOwner(shopId, ownerOpenid) {
  return callCloud(API.REMOVE_OWNER, {
    shopId,
    ownerOpenid
  });
}

module.exports = {
  listOwners,
  createInvite,
  removeOwner
};
