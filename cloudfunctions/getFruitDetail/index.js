const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const fruits = db.collection("fruits");
const shops = db.collection("shops");

function canManageShop(openid, shop) {
  return Boolean(
    openid &&
      shop &&
      Array.isArray(shop.ownerIds) &&
      shop.ownerIds.includes(openid)
  );
}

function pickFruit(fruit, shopName) {
  return {
    _id: fruit._id,
    shopId: fruit.shopId,
    shopName,
    name: fruit.name,
    categoryIds: fruit.categoryIds || [],
    tags: fruit.tags || [],
    mainImage: fruit.mainImage || "",
    detailImages: fruit.detailImages || [],
    description: fruit.description || "",
    origin: fruit.origin || "",
    specs: fruit.specs || [],
    specGroups: fruit.specGroups || [],
    skus: fruit.skus || [],
    status: fruit.status || "on_sale",
    createTime: fruit.createTime,
    updateTime: fruit.updateTime
  };
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const fruitId = String((event && event.fruitId) || "").trim();
  const includeOffSale = Boolean(event && event.includeOffSale);

  if (!fruitId) {
    return {
      success: false,
      message: "缺少商品信息"
    };
  }

  try {
    const result = await fruits.doc(fruitId).get();
    const fruit = result.data;

    if (!fruit) {
      return {
        success: false,
        message: "商品不存在"
      };
    }

    let shopName = "";
    let shop = null;

    if (fruit.shopId) {
      const shopResult = await shops.doc(fruit.shopId).get();
      shop = shopResult.data || null;
      shopName = shop && shop.name ? shop.name : "";
    }

    if (fruit.status === "off_sale" && (!includeOffSale || !canManageShop(openid, shop))) {
      return {
        success: false,
        message: "商品已下架"
      };
    }

    return {
      success: true,
      fruit: pickFruit(fruit, shopName)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "商品加载失败"
    };
  }
};
