const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const users = db.collection("users");
const shops = db.collection("shops");

const NOT_ALLOWED = {
  success: false,
  code: "MERCHANT_NOT_ALLOWED",
  message: "当前微信未开通商家权限，请联系店主开通"
};

async function getUserByOpenid(openid) {
  const result = await users.where({ openid }).limit(1).get();
  return result.data[0] || null;
}

async function getShopById(shopId) {
  if (!shopId) {
    return null;
  }

  const result = await shops.doc(shopId).get();
  return result.data || null;
}

function isShopOwner(openid, shop) {
  return Boolean(shop && Array.isArray(shop.ownerIds) && shop.ownerIds.includes(openid));
function pickShop(shop) {
  if (!shop) {
    return null;
  }

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

function canManageShop(openid, user, shop) {
  if (!openid || !user || !shop) {
    return false;
  }

  const ownerIds = Array.isArray(shop.ownerIds) ? shop.ownerIds : [];
  return Boolean(user.shopId && user.shopId === shop._id && ownerIds.includes(openid));
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return {
      success: false,
      code: "MISSING_OPENID",
      message: "无法获取微信用户身份"
    };
  }

  const existingUser = await getUserByOpenid(openid);

  if (existingUser && existingUser.shopId) {
    const shop = await getShopById(existingUser.shopId);

    if (isShopOwner(openid, shop)) {
      return {
        success: true,
        openid,
        user: existingUser,
        shop,
        isNewUser: false,
        isNewShop: false
      };
    }

    await users.doc(existingUser._id).update({
      data: {
        role: "user",
        shopId: "",
        updateTime: now
      }
    });
  }

  const shopAddResult = await shops.add({
    data: {
      name: DEFAULT_SHOP_NAME,
      logo: DEFAULT_SHOP_LOGO,
      announcement: "",
      contactPhone: "",
      address: "",
      businessStatus: "open",
      creatorId: openid,
      ownerIds: [openid],
      createTime: now,
      updateTime: now
    }
  });

  const shopId = shopAddResult._id;
  const userData = {
    openid,
    role: "creator",
    shopId,
    createTime: now,
    updateTime: now
  };
  const user = await getUserByOpenid(openid);
  const shop = await getShopById(user && user.shopId);

  if (!canManageShop(openid, user, shop)) {
    return NOT_ALLOWED;
  }

  return {
    success: true,
    openid,
    user,
    shop: pickShop(shop),
    isNewUser: false,
    isNewShop: false
  };
};
