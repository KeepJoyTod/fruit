const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");
const fruits = db.collection("fruits");

async function assertCanManageShop(openid, shopId) {
  const shopResult = await shops.doc(shopId).get();
  const shop = shopResult.data;

  if (!shop || !Array.isArray(shop.ownerIds) || !shop.ownerIds.includes(openid)) {
    throw new Error("无权删除该商品");
  }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const fruitId = String((event && event.fruitId) || "").trim();

  if (!openid) {
    return {
      success: false,
      message: "无法获取微信用户身份"
    };
  }

  if (!fruitId) {
    return {
      success: false,
      message: "缺少商品信息"
    };
  }

  try {
    const fruitResult = await fruits.doc(fruitId).get();
    const fruit = fruitResult.data;

    if (!fruit) {
      throw new Error("商品不存在");
    }

    await assertCanManageShop(openid, fruit.shopId);
    await fruits.doc(fruitId).remove();

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "删除商品失败"
    };
  }
};
