const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const users = db.collection("users");
const shops = db.collection("shops");
const invites = db.collection("invites");

async function getUserByOpenid(openid) {
  const result = await users.where({ openid }).limit(1).get();
  return result.data[0] || null;
}

async function getShop(shopId) {
  const result = await shops.doc(shopId).get();
  return result.data || null;
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

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const inviteCode = String((event && event.inviteCode) || "").trim();
  const now = new Date();

  if (!openid) {
    return {
      success: false,
      message: "Missing user identity"
    };
  }

  if (!inviteCode) {
    return {
      success: false,
      message: "Missing invite code"
    };
  }

  try {
    const inviteResult = await invites.where({ code: inviteCode }).limit(1).get();
    const invite = inviteResult.data[0];

    if (!invite || invite.status !== "active") {
      throw new Error("Invite is invalid");
    }

    const expireTime = invite.expireTime ? new Date(invite.expireTime) : null;
    if (expireTime && expireTime.getTime() < now.getTime()) {
      await invites.doc(invite._id).update({
        data: {
          status: "expired",
          updateTime: db.serverDate()
        }
      });
      throw new Error("Invite is expired");
    }

    const shop = await getShop(invite.shopId);
    if (!shop) {
      throw new Error("Shop not found");
    }

    await shops.doc(invite.shopId).update({
      data: {
        ownerIds: _.addToSet(openid),
        updateTime: db.serverDate()
      }
    });

    const existingUser = await getUserByOpenid(openid);
    const userData = {
      openid,
      role: shop.creatorId === openid ? "creator" : "owner",
      shopId: invite.shopId,
      updateTime: db.serverDate()
    };

    if (existingUser) {
      await users.doc(existingUser._id).update({ data: userData });
    } else {
      await users.add({
        data: {
          ...userData,
          createTime: db.serverDate()
        }
      });
    }

    await invites.doc(invite._id).update({
      data: {
        status: "used",
        usedBy: openid,
        usedTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    const updatedShop = await getShop(invite.shopId);
    const user = await getUserByOpenid(openid);

    return {
      success: true,
      openid,
      user,
      shop: pickShop(updatedShop),
      isNewShop: false,
      isInvite: true
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to accept invite"
    };
  }
};
