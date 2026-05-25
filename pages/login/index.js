const app = getApp();

Page({
  data: {
    loading: false,
    inviteCode: "",
    isInviteMode: false
  },

  onLoad(options) {
    const inviteCode = String((options && options.inviteCode) || "").trim();
    this.setData({
      inviteCode,
      isInviteMode: Boolean(inviteCode)
    });
  },

  async handleLogin() {
    if (this.data.loading) {
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({
      title: this.data.isInviteMode ? "加入中" : "登录中"
    });

    try {
      const result = await wx.cloud.callFunction({
        name: this.data.isInviteMode ? "acceptInvite" : "merchantLogin",
        data: this.data.isInviteMode
          ? {
              inviteCode: this.data.inviteCode
            }
          : {}
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
        title: this.data.isInviteMode ? "已加入店铺" : data.isNewShop ? "已创建店铺" : "登录成功",
        icon: "success"
      });

      wx.redirectTo({
        url: "/pages/merchant/index"
      });
    } catch (error) {
      console.error("merchant login failed", error);
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
