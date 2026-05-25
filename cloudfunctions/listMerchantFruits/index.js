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
    throw new Error("无权查看该店铺商品");
  }

  return shop;
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const shopId = String((event && event.shopId) || "").trim();

  if (!openid) {
    return {
      success: false,
      message: "无法获取微信用户身份"
    };
  }

  if (!shopId) {
    return {
      success: false,
      message: "缺少店铺信息"
    };
  }

  try {
    await assertCanManageShop(openid, shopId);

    const result = await fruits
      .where({
        shopId
      })
      .orderBy("createTime", "desc")
      .get();

    return {
      success: true,
      fruits: (result.data || []).map((fruit) => ({
        ...fruit,
        status: fruit.status || "on_sale"
      }))
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "商品加载失败"
    };
  }
};
