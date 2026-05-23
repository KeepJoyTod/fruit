const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const users = db.collection("users");
const shops = db.collection("shops");

const DEFAULT_SHOP_NAME = "水果小店";
const DEFAULT_SHOP_LOGO = "";

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

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const now = db.serverDate();

  if (!openid) {
    return {
      success: false,
      message: "无法获取微信用户身份"
    };
  }

  const existingUser = await getUserByOpenid(openid);

  if (existingUser && existingUser.shopId) {
    const shop = await getShopById(existingUser.shopId);

    return {
      success: true,
      openid,
      user: existingUser,
      shop,
      isNewUser: false,
      isNewShop: false
    };
  }

  const shopAddResult = await shops.add({
    data: {
      name: DEFAULT_SHOP_NAME,
      logo: DEFAULT_SHOP_LOGO,
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

  if (existingUser) {
    await users.doc(existingUser._id).update({
      data: {
        role: "creator",
        shopId,
        updateTime: now
      }
    });
  } else {
    await users.add({
      data: userData
    });
  }

  const shop = await getShopById(shopId);
  const user = await getUserByOpenid(openid);

  return {
    success: true,
    openid,
    user,
    shop,
    isNewUser: !existingUser,
    isNewShop: true
  };
};
