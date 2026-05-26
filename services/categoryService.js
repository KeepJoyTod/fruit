const { callCloud } = require("../utils/request");
const API = require("../constants/api");

function listPublicCategories() {
  return callCloud(API.LIST_PUBLIC_CATEGORIES, {}, {
    errorMessage: "分类加载失败"
  });
}

function listMerchantCategories(shopId) {
  return callCloud(API.LIST_MERCHANT_CATEGORIES, {
    shopId
  }, {
    errorMessage: "分类加载失败"
  });
}

function saveCategory(payload) {
  return callCloud(API.SAVE_CATEGORY, payload);
}

function deleteCategory(categoryId) {
  return callCloud(API.DELETE_CATEGORY, {
    categoryId
  });
}

module.exports = {
  listPublicCategories,
  listMerchantCategories,
  saveCategory,
  deleteCategory
};
