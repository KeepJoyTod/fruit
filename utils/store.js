const eventBus = require("./eventBus");

const STORAGE_KEYS = {
  auth: "store:auth",
  refreshHomeFruits: "store:refreshHomeFruits"
};

const EVENTS = {
  authChanged: "auth:changed",
  shopChanged: "shop:changed",
  homeFruitsChanged: "home-fruits:changed"
};

function getAppSafe() {
  try {
    return getApp();
  } catch (error) {
    return null;
  }
}

function getGlobalData() {
  const app = getAppSafe();
  return app ? app.globalData : {};
}

function getDefaultShopName() {
  return getGlobalData().shopName || "水果小店";
}

function readAuthStorage() {
  return wx.getStorageSync(STORAGE_KEYS.auth) || {};
}

function writeAuthStorage(auth) {
  wx.setStorageSync(STORAGE_KEYS.auth, auth || {});
}

function syncAuthToGlobal(auth) {
  const globalData = getGlobalData();
  const nextAuth = auth || {};
  const shop = nextAuth.shop || null;

  globalData.openid = nextAuth.openid || "";
  globalData.user = nextAuth.user || null;
  globalData.shop = shop;
  globalData.shopName = shop && shop.name ? shop.name : globalData.shopName || getDefaultShopName();
  globalData.shopLogo = shop && shop.logo ? shop.logo : "";
}

function initStore() {
  const auth = readAuthStorage();
  syncAuthToGlobal(auth);
  getGlobalData().shouldRefreshHomeFruits = shouldRefreshHomeFruits();
}

function setAuth(auth) {
  const nextAuth = {
    openid: auth && auth.openid ? auth.openid : "",
    user: auth && auth.user ? auth.user : null,
    shop: auth && auth.shop ? auth.shop : null
  };

  writeAuthStorage(nextAuth);
  syncAuthToGlobal(nextAuth);
  eventBus.emit(EVENTS.authChanged, nextAuth);

  if (nextAuth.shop) {
    eventBus.emit(EVENTS.shopChanged, nextAuth.shop);
  }
}

function clearAuth() {
  wx.removeStorageSync(STORAGE_KEYS.auth);
  syncAuthToGlobal({});
  eventBus.emit(EVENTS.authChanged, getAuth());
}

function getAuth() {
  const globalData = getGlobalData();
  const cached = readAuthStorage();

  return {
    openid: globalData.openid || cached.openid || "",
    user: globalData.user || cached.user || null,
    shop: globalData.shop || cached.shop || null
  };
}

function getOpenid() {
  return getAuth().openid;
}

function getUser() {
  return getAuth().user;
}

function getShop() {
  return getAuth().shop;
}

function getShopId() {
  const shop = getShop();
  return shop && shop._id ? shop._id : "";
}

function getShopName() {
  const shop = getShop();
  return shop && shop.name ? shop.name : getGlobalData().shopName || getDefaultShopName();
}

function getShopLogo() {
  const shop = getShop();
  return shop && shop.logo ? shop.logo : getGlobalData().shopLogo || "";
}

function setShop(shop) {
  const auth = getAuth();
  const nextAuth = {
    openid: auth.openid,
    user: auth.user,
    shop: shop || null
  };

  writeAuthStorage(nextAuth);
  syncAuthToGlobal(nextAuth);
  eventBus.emit(EVENTS.shopChanged, nextAuth.shop);
  eventBus.emit(EVENTS.authChanged, nextAuth);
}

function markHomeFruitsChanged() {
  wx.setStorageSync(STORAGE_KEYS.refreshHomeFruits, true);
  getGlobalData().shouldRefreshHomeFruits = true;
  eventBus.emit(EVENTS.homeFruitsChanged, true);
}

function clearHomeFruitsChanged() {
  wx.setStorageSync(STORAGE_KEYS.refreshHomeFruits, false);
  getGlobalData().shouldRefreshHomeFruits = false;
}

function shouldRefreshHomeFruits() {
  return Boolean(wx.getStorageSync(STORAGE_KEYS.refreshHomeFruits) || getGlobalData().shouldRefreshHomeFruits);
}

module.exports = {
  EVENTS,
  initStore,
  setAuth,
  clearAuth,
  getAuth,
  getOpenid,
  getUser,
  getShop,
  getShopId,
  getShopName,
  getShopLogo,
  setShop,
  markHomeFruitsChanged,
  clearHomeFruitsChanged,
  shouldRefreshHomeFruits
};
