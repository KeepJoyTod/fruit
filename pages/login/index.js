const app = getApp();

Page({
  data: {
    loading: false
  },

  async handleLogin() {
    if (this.data.loading) {
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({
      title: "登录中"
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "merchantLogin"
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "登录失败");
      }

      app.globalData.openid = data.openid;
      app.globalData.user = data.user;
      app.globalData.shop = data.shop;
      app.globalData.shopName = data.shop && data.shop.name ? data.shop.name : app.globalData.shopName;
      app.globalData.shopLogo = data.shop && data.shop.logo ? data.shop.logo : "";

      wx.showToast({
        title: data.isNewShop ? "已创建店铺" : "登录成功",
        icon: "success"
      });

      wx.redirectTo({
        url: "/pages/merchant/index"
      });
    } catch (error) {
      console.error("merchantLogin failed", error);
      wx.showToast({
        title: error.message || "登录失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  }
});
