const { setCache, getCache, removeCache } = require("./cache");
const categoryService = require("../services/categoryService");

const PUBLIC_CATEGORY_CACHE_KEY = "publicCategories";
const MERCHANT_CATEGORY_CACHE_PREFIX = "merchantCategories:";
const CATEGORY_CACHE_TTL = 10 * 60 * 1000;

function buildCategoryMap(categories) {
  return (Array.isArray(categories) ? categories : []).reduce((map, item) => {
    if (item && item._id) {
      map[item._id] = item;
    }

    return map;
  }, {});
}

function syncGlobalCategoryCache(categories) {
  const app = getApp();
  const list = Array.isArray(categories) ? categories : [];

  app.globalData.categories = list;
  app.globalData.categoryMap = buildCategoryMap(list);
}

async function loadPublicCategories(options) {
  const requestOptions = options || {};
  const cached = !requestOptions.force ? getCache(PUBLIC_CATEGORY_CACHE_KEY) : null;

  if (cached) {
    syncGlobalCategoryCache(cached);
    return cached;
  }

  const data = await categoryService.listPublicCategories();
  const categories = data.categories || [];

  syncGlobalCategoryCache(categories);
  setCache(PUBLIC_CATEGORY_CACHE_KEY, categories, CATEGORY_CACHE_TTL);
  return categories;
}

async function loadMerchantCategories(shopId, options) {
  const requestOptions = options || {};
  const cacheKey = `${MERCHANT_CATEGORY_CACHE_PREFIX}${shopId || "unknown"}`;
  const cached = shopId && !requestOptions.force ? getCache(cacheKey) : null;

  if (cached) {
    syncGlobalCategoryCache(cached);
    return cached;
  }

  const data = await categoryService.listMerchantCategories(shopId);
  const categories = data.categories || [];

  syncGlobalCategoryCache(categories);
  if (shopId) {
    setCache(cacheKey, categories, CATEGORY_CACHE_TTL);
  }

  return categories;
}

function clearPublicCategoryCache() {
  removeCache(PUBLIC_CATEGORY_CACHE_KEY);
}

function clearMerchantCategoryCache(shopId) {
  removeCache(`${MERCHANT_CATEGORY_CACHE_PREFIX}${shopId || "unknown"}`);
}

module.exports = {
  buildCategoryMap,
  syncGlobalCategoryCache,
  loadPublicCategories,
  loadMerchantCategories,
  clearPublicCategoryCache,
  clearMerchantCategoryCache
};
