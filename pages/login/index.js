const authService = require("../../services/authService");
const store = require("../../utils/store");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");

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
    ui.showLoading(this.data.isInviteMode ? "加入中" : "登录中");

    try {
      const data = this.data.isInviteMode
        ? await authService.acceptInvite(this.data.inviteCode)
        : await authService.merchantLogin();

      store.setAuth({
        openid: data.openid,
        user: data.user,
        shop: data.shop
      });

      ui.showSuccess(this.data.isInviteMode ? "已加入店铺" : "登录成功");
      navigation.redirectTo("/pages/merchant/index");
    } catch (error) {
      console.error("merchant login failed", error);
      ui.showError(error, "登录失败");
    } finally {
      ui.hideLoading();
      this.setData({ loading: false });
    }
  }
});
