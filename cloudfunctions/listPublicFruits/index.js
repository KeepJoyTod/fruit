const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const fruits = db.collection("fruits");
const shops = db.collection("shops");
const _ = db.command;

function normalizePage(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function normalizeKeyword(value) {
  return String(value || "").trim();
}

function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildQueryCondition(keyword, categoryId) {
  const condition = {};

  if (keyword) {
    condition.name = db.RegExp({
      regexp: escapeRegExp(keyword),
      options: "i"
    });
  }

  if (categoryId) {
    condition.categoryIds = categoryId;
  }

  return condition;
}

async function loadShopMap(shopIds) {
  const map = {};
  const uniqueShopIds = Array.from(new Set((shopIds || []).filter(Boolean)));

  if (uniqueShopIds.length === 0) {
    return map;
  }

  const result = await shops
    .where({
      _id: _.in(uniqueShopIds)
    })
    .field({
      name: true
    })
    .get();

  (result.data || []).forEach((shop) => {
    if (shop && shop._id) {
      map[shop._id] = shop;
    }
  });

  return map;
}

function getMinPrice(specs) {
  if (!Array.isArray(specs) || specs.length === 0) {
    return 0;
  }

  return specs.reduce((min, spec) => {
    const price = Number(spec && spec.price ? spec.price : 0);
    return min === 0 || (price > 0 && price < min) ? price : min;
  }, 0);
}

exports.main = async (event) => {
  const payload = event || {};
  const keyword = normalizeKeyword(payload.keyword);
  const categoryId = String(payload.categoryId || "").trim();
  const page = normalizePage(payload.page, 1, 1, 9999);
  const pageSize = normalizePage(payload.pageSize, 20, 1, 50);

  try {
    const start = (page - 1) * pageSize;
    const condition = buildQueryCondition(keyword, categoryId);
    const result = await fruits
      .where(condition)
      .field({
        shopId: true,
        name: true,
        tags: true,
        mainImage: true,
        origin: true,
        specs: true,
        categoryIds: true,
        createTime: true
      })
      .orderBy("createTime", "desc")
      .skip(start)
      .limit(pageSize + 1)
      .get();
    const pageData = result.data || [];
    const currentList = pageData.slice(0, pageSize);
    const hasMore = pageData.length > pageSize;
    const shopMap = await loadShopMap(currentList.map((fruit) => fruit.shopId));

    return {
      success: true,
      page,
      pageSize,
      hasMore,
      fruits: currentList.map((fruit) => ({
        _id: fruit._id,
        shopId: fruit.shopId,
        shopName: shopMap[fruit.shopId] && shopMap[fruit.shopId].name ? shopMap[fruit.shopId].name : "",
        name: fruit.name,
        tags: fruit.tags || [],
        mainImage: fruit.mainImage || "",
        origin: fruit.origin || "",
        minPrice: getMinPrice(fruit.specs),
        categoryIds: fruit.categoryIds || [],
        createTime: fruit.createTime
      }))
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "商品加载失败"
    };
  }
};
