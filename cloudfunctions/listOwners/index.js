const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const shops = db.collection("shops");
const users = db.collection("users");

async function getShop(shopId) {
  const result = await shops.doc(shopId).get();
  return result.data || null;
}

function assertCreator(openid, shop) {
  if (!shop || !Array.isArray(shop.ownerIds) || !shop.ownerIds.includes(openid)) {
    throw new Error("没有权限，请先联系店主");
  }

  if (shop.creatorId !== openid) {
    throw new Error("当前账号不是店主，没有权限管理团队成员，请联系店主处理");
  }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const shopId = String((event && event.shopId) || "").trim();

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

    const ownerIds = Array.isArray(shop.ownerIds) ? shop.ownerIds : [];
    const ownerResult = ownerIds.length
      ? await users.where({ openid: _.in(ownerIds) }).get()
      : { data: [] };
    const userMap = (ownerResult.data || []).reduce((map, user) => {
      map[user.openid] = user;
      return map;
    }, {});

    return {
      success: true,
      isCreator: true,
      owners: ownerIds.map((ownerOpenid) => {
        const user = userMap[ownerOpenid] || {};
        return {
          openid: ownerOpenid,
          displayName: user.nickName || user.name || `用户 ${ownerOpenid.slice(-6)}`,
          role: ownerOpenid === shop.creatorId ? "creator" : "owner",
          roleText: ownerOpenid === shop.creatorId ? "店主" : "Owner",
          removable: ownerOpenid !== shop.creatorId,
          createTime: user.createTime,
          updateTime: user.updateTime
        };
      })
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to load owners"
    };
  }
};
