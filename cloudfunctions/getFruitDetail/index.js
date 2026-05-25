const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const fruits = db.collection("fruits");
const shops = db.collection("shops");

exports.main = async (event) => {
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

    if (fruit.status === "off_sale" && !includeOffSale) {
      return {
        success: false,
        message: "商品已下架"
      };
    }

    let shopName = "";

    if (fruit.shopId) {
      const shopResult = await shops.doc(fruit.shopId).get();
      const shop = shopResult.data;
      shopName = shop && shop.name ? shop.name : "";
    }

    return {
      success: true,
      fruit: {
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
        status: fruit.status || "on_sale",
        createTime: fruit.createTime,
        updateTime: fruit.updateTime
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "商品加载失败"
    };
  }
};
