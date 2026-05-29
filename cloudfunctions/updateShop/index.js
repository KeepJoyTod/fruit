const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBusinessStatus(value) {
  return value === "closed" ? "closed" : "open";
}

function pickPublicShop(shop) {
  return {
    _id: shop._id,
    name: shop.name || "",
    logo: shop.logo || "",
    announcement: shop.announcement || "",
    contactPhone: shop.contactPhone || "",
    address: shop.address || "",
    businessStatus: shop.businessStatus || "open",
    creatorId: shop.creatorId,
    ownerIds: shop.ownerIds || [],
    createTime: shop.createTime,
    updateTime: shop.updateTime
  };
}

async function assertCanManageShop(openid, shopId) {
  const shopResult = await shops.doc(shopId).get();
  const shop = shopResult.data;

  if (!shop || !Array.isArray(shop.ownerIds) || !shop.ownerIds.includes(openid)) {
    throw new Error("No permission to manage this shop");
  }

  return shop;
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const payload = event || {};
  const shopId = normalizeString(payload.shopId);
  const name = normalizeString(payload.name);
  const logo = normalizeString(payload.logo);
  const contactPhone = normalizeString(payload.contactPhone);
  const address = normalizeString(payload.address);
  const businessStatus = normalizeBusinessStatus(payload.businessStatus);

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

  if (!name) {
    return {
      success: false,
      message: "Shop name is required"
    };
  }

  try {
    await assertCanManageShop(openid, shopId);

    await shops.doc(shopId).update({
      data: {
        name,
        logo,
        contactPhone,
        address,
        businessStatus,
        updateTime: db.serverDate()
      }
    });

    const updatedShop = await shops.doc(shopId).get();

    return {
      success: true,
      shop: pickPublicShop(updatedShop.data)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to update shop"
    };
  }
};
