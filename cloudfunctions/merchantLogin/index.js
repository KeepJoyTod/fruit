const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const users = db.collection("users");
const shops = db.collection("shops");

const DEFAULT_SHOP_NAME = "水果小店";
const DEFAULT_SHOP_LOGO = "";
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

  try {
    const result = await shops.doc(shopId).get();
    return result.data || null;
  } catch (error) {
    const message = String((error && error.message) || "");

    if (message.includes("document.get:fail") && message.includes("does not exist")) {
      return null;
    }

    throw error;
  }
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

async function clearInvalidMerchantUser(user) {
  if (!user || !user._id) {
    return;
  }

  await users.doc(user._id).update({
    data: {
      role: "user",
      shopId: "",
      updateTime: db.serverDate()
    }
  });
}

async function createCreatorShop(openid) {
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
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });
  const shopId = shopAddResult._id || shopAddResult.id;
  const userData = {
    openid,
    role: "creator",
    shopId,
    updateTime: db.serverDate()
  };
  const existingUser = await getUserByOpenid(openid);

  if (existingUser) {
    await users.doc(existingUser._id).update({
      data: userData
    });
  } else {
    await users.add({
      data: {
        ...userData,
        createTime: db.serverDate()
      }
    });
  }

  return getShopById(shopId);
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

  try {
    const existingUser = await getUserByOpenid(openid);

    if (existingUser && existingUser.shopId) {
      const shop = await getShopById(existingUser.shopId);

      if (isShopOwner(openid, shop) && canManageShop(openid, existingUser, shop)) {
        return {
          success: true,
          openid,
          user: existingUser,
          shop: pickShop(shop),
          isNewUser: false,
          isNewShop: false
        };
      }

      await clearInvalidMerchantUser(existingUser);
      return NOT_ALLOWED;
    }

    const shop = await createCreatorShop(openid);
    const user = await getUserByOpenid(openid);

    return {
      success: true,
      openid,
      user,
      shop: pickShop(shop),
      isNewUser: !existingUser,
      isNewShop: true
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "商家登录失败"
    };
  }
};
