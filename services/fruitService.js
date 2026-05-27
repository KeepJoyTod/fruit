const { callCloud } = require("../utils/request");
const API = require("../constants/api");

function listPublicFruits(params) {
  return callCloud(API.LIST_PUBLIC_FRUITS, params);
}

function listMerchantFruits(shopId) {
  return callCloud(API.LIST_MERCHANT_FRUITS, {
    shopId
  });
}

function getFruitDetail(params) {
  return callCloud(API.GET_FRUIT_DETAIL, params);
}

function createFruit(payload) {
  return callCloud(API.CREATE_FRUIT, payload);
}

function updateFruit(payload) {
  return callCloud(API.UPDATE_FRUIT, payload);
}

function updateFruitStatus(fruitId, status) {
  return callCloud(API.UPDATE_FRUIT_STATUS, {
    fruitId,
    status
  });
}

function deleteFruit(fruitId) {
  return callCloud(API.DELETE_FRUIT, {
    fruitId
  });
}

module.exports = {
  listPublicFruits,
  listMerchantFruits,
  getFruitDetail,
  createFruit,
  updateFruit,
  updateFruitStatus,
  deleteFruit
};
