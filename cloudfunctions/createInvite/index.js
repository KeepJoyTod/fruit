const cloud = require("wx-server-sdk");
const crypto = require("crypto");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");
const invites = db.collection("invites");
const INVITE_ROLE = "manager";

function createCode() {
  return crypto.randomBytes(16).toString("hex");
}

async function createUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createCode();
    const result = await invites.where({ code }).limit(1).get();

    if (!result.data || result.data.length === 0) {
      return code;
    }
  }

  throw new Error("Failed to create invite code");
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

    const code = await createUniqueCode();
    await invites.add({
      data: {
        shopId,
        creatorId: openid,
        code,
        role: INVITE_ROLE,
        status: "active",
        expireTime,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      code,
      role: INVITE_ROLE,
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
