function now() {
  return Date.now();
}

function setCache(key, value, ttl) {
  wx.setStorageSync(key, {
    value,
    expireAt: ttl ? now() + ttl : 0
  });
}

function getCache(key) {
  const cache = wx.getStorageSync(key);

  if (!cache || typeof cache !== "object") {
    return null;
  }

  if (cache.expireAt && cache.expireAt <= now()) {
    wx.removeStorageSync(key);
    return null;
  }

  return cache.value;
}

function removeCache(key) {
  wx.removeStorageSync(key);
}

module.exports = {
  setCache,
  getCache,
  removeCache
};
