const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");
const fruits = db.collection("fruits");

function normalizeStatus(value) {
  if (value !== "on_sale" && value !== "off_sale") {
    throw new Error("Invalid fruit status");
  }

  return value;
}

async function assertCanManageShop(openid, shopId) {
  const shopResult = await shops.doc(shopId).get();
  const shop = shopResult.data;

  if (!shop || !Array.isArray(shop.ownerIds) || !shop.ownerIds.includes(openid)) {
    throw new Error("No permission to manage this fruit");
  }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const fruitId = String((event && event.fruitId) || "").trim();

  if (!openid) {
    return {
      success: false,
      message: "Missing user identity"
    };
  }

  if (!fruitId) {
    return {
      success: false,
      message: "Missing fruit id"
    };
  }

  try {
    const status = normalizeStatus(event && event.status);
    const fruitResult = await fruits.doc(fruitId).get();
    const fruit = fruitResult.data;

    if (!fruit) {
      throw new Error("Fruit not found");
    }

    await assertCanManageShop(openid, fruit.shopId);

    await fruits.doc(fruitId).update({
      data: {
        status,
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      status
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to update fruit status"
    };
  }
};
