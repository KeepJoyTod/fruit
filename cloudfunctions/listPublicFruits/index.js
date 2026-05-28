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

function normalizeImageList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((item) => String(item || "").trim()).filter(Boolean);
}

function pickFruitMainImage(fruit) {
  const mainImage = String((fruit && fruit.mainImage) || "").trim();

  if (mainImage) {
    return mainImage;
  }

  return normalizeImageList(fruit && fruit.detailImages)[0] || "";
}

function buildQueryCondition(keyword, categoryId, tag) {
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

  if (tag) {
    condition.tags = tag;
  }

  return condition;
}

function isFruitPublicVisible(fruit) {
  return !fruit || !fruit.status || fruit.status === "on_sale";
}

async function queryFruits(condition, start, limit) {
  const result = await fruits
    .where(condition)
    .field({
      shopId: true,
      name: true,
      tags: true,
      mainImage: true,
      detailImages: true,
      origin: true,
      specs: true,
      specGroups: true,
      skus: true,
      status: true,
      categoryIds: true,
      createTime: true
    })
    .orderBy("createTime", "desc")
    .skip(start)
    .limit(limit)
    .get();

  return result.data || [];
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

function getMinSkuPrice(fruit) {
  const skus = Array.isArray(fruit && fruit.skus) ? fruit.skus : [];
  if (skus.length > 0) {
    return skus.reduce((min, sku) => {
      const price = Number(sku && sku.price ? sku.price : 0);
      return min === 0 || (price > 0 && price < min) ? price : min;
    }, 0);
  }

  return getMinPrice(fruit && fruit.specs);
}

exports.main = async (event) => {
  const payload = event || {};
  const keyword = normalizeKeyword(payload.keyword);
  const categoryId = String(payload.categoryId || "").trim();
  const tag = String(payload.tag || "").trim();
  const page = normalizePage(payload.page, 1, 1, 9999);
  const pageSize = normalizePage(payload.pageSize, 20, 1, 50);

  try {
    const start = (page - 1) * pageSize;
    const condition = buildQueryCondition(keyword, categoryId, tag);
    let pageData = await queryFruits(
      Object.assign({}, condition, {
        status: "on_sale"
      }),
      start,
      pageSize + 1
    );

    // 兼容历史商品：旧数据没有 status 字段，默认视为上架商品。
    if (pageData.length === 0) {
      pageData = (await queryFruits(condition, start, Math.min(pageSize * 3, 50))).filter(isFruitPublicVisible);
    }

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
        mainImage: pickFruitMainImage(fruit),
        origin: fruit.origin || "",
        minPrice: getMinSkuPrice(fruit),
        status: fruit.status || "on_sale",
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
