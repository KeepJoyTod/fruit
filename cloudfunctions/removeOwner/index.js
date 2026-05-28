const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const users = db.collection("users");
const shops = db.collection("shops");

async function getShop(shopId) {
  const result = await shops.doc(shopId).get();
  return result.data || null;
}

function assertCreator(openid, shop) {
  if (!shop || shop.creatorId !== openid) {
    throw new Error("Only shop creator can remove owners");
  }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const shopId = String((event && event.shopId) || "").trim();
  const ownerOpenid = String((event && event.ownerOpenid) || "").trim();

  if (!openid) {
    return {
      success: false,
      message: "Missing user identity"
    };
  }

  if (!shopId || !ownerOpenid) {
    return {
      success: false,
      message: "Missing owner information"
    };
  }

  try {
    const shop = await getShop(shopId);
    assertCreator(openid, shop);

    if (ownerOpenid === shop.creatorId) {
      throw new Error("Shop creator cannot be removed");
    }

    await shops.doc(shopId).update({
      data: {
        ownerIds: _.pull(ownerOpenid),
        updateTime: db.serverDate()
      }
    });

    const userResult = await users.where({ openid: ownerOpenid, shopId }).limit(1).get();
    const user = userResult.data[0];
    if (user) {
      await users.doc(user._id).update({
        data: {
          role: "user",
          role: "customer",
          shopId: "",
          updateTime: db.serverDate()
        }
      });
    }

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to remove owner"
    };
  }
};
