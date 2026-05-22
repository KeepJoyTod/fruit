App({
  globalData: {
    envId: "cloud1-d1g40zhsfcb12d457",
    shopName: "水果小店",
    shopLogo: "",
    openid: "",
    user: null,
    shop: null
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      return;
    }

    wx.cloud.init({
      env: this.globalData.envId,
      traceUser: true
    });
  }
});
