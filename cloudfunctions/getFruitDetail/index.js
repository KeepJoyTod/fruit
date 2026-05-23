const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const fruits = db.collection("fruits");

exports.main = async (event) => {
  const fruitId = String((event && event.fruitId) || "").trim();

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

    return {
      success: true,
      fruit: {
        _id: fruit._id,
        shopId: fruit.shopId,
        name: fruit.name,
        categoryIds: fruit.categoryIds || [],
        tags: fruit.tags || [],
        mainImage: fruit.mainImage || "",
        detailImages: fruit.detailImages || [],
        description: fruit.description || "",
        origin: fruit.origin || "",
        specs: fruit.specs || [],
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
