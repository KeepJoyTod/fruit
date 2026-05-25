const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");

function normalizeString(value) {
  return String(value || "").trim();
}

function pickShop(shop) {
  return {
    _id: shop._id,
    name: shop.name || "",
    logo: shop.logo || "",
    announcement: shop.announcement || "",
    announcementUpdateTime: shop.announcementUpdateTime,
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
  const announcement = normalizeString(payload.announcement);

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

  if (!announcement) {
    return {
      success: false,
      message: "Announcement is required"
    };
  }

  if (announcement.length > 200) {
    return {
      success: false,
      message: "Announcement is too long"
    };
  }

  try {
    await assertCanManageShop(openid, shopId);

    await shops.doc(shopId).update({
      data: {
        announcement,
        announcementUpdateTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    const updatedShop = await shops.doc(shopId).get();

    return {
      success: true,
      shop: pickShop(updatedShop.data)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to publish announcement"
    };
  }
};
