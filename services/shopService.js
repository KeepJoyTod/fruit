const { callCloud } = require("../utils/request");
const API = require("../constants/api");

function getPublicShop() {
  return callCloud(API.GET_PUBLIC_SHOP);
}

function updateShop(payload) {
  return callCloud(API.UPDATE_SHOP, payload);
}

module.exports = {
  getPublicShop,
  updateShop
};
