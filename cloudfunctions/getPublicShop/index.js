const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");

function pickPublicShop(shop) {
  return {
    _id: shop._id,
    name: shop.name || "",
    logo: shop.logo || "",
    announcement: shop.announcement || "",
    announcementUpdateTime: shop.announcementUpdateTime,
    contactPhone: shop.contactPhone || "",
    address: shop.address || "",
    businessStatus: shop.businessStatus || "open"
  };
}

exports.main = async (event) => {
  const shopId = String((event && event.shopId) || "").trim();

  try {
    let shop = null;

    if (shopId) {
      const result = await shops.doc(shopId).get();
      shop = result.data || null;
    } else {
      const result = await shops.orderBy("createTime", "asc").limit(1).get();
      shop = result.data && result.data[0] ? result.data[0] : null;
    }

    if (!shop) {
      return {
        success: false,
        message: "Shop not found"
      };
    }

    return {
      success: true,
      shop: pickPublicShop(shop)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to load shop"
    };
  }
};
