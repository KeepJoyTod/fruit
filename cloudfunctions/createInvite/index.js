const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");
const invites = db.collection("invites");

function createCode() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function getShop(shopId) {
  const result = await shops.doc(shopId).get();
  return result.data || null;
}

function assertCreator(openid, shop) {
  if (!shop || shop.creatorId !== openid) {
    throw new Error("Only shop creator can create invites");
  }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const shopId = String((event && event.shopId) || "").trim();
  const now = new Date();
  const expireTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (!openid) {
    return {
      success: false,
      message: "Missing user identity"
    };
  }

  if (!shopId) {
    return {
      success: false,
      message: "Missing shop id"
    };
  }

  try {
    const shop = await getShop(shopId);
    assertCreator(openid, shop);

    const code = createCode();
    await invites.add({
      data: {
        shopId,
        creatorOpenid: openid,
        code,
        status: "active",
        expireTime,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      code,
      path: `/pages/login/index?inviteCode=${code}`,
      expireTime
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to create invite"
    };
  }
};
