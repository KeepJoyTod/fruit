const { login } = require('../../../utils/request');

Page({
  data: {
    loggingIn: false
  },

  loginAsCustomer() {
    this.doLogin(() => {
      wx.switchTab({ url: '/pages/customer/home/index' });
    });
  },

  loginAsVendor() {
    this.doLogin(() => {
      wx.switchTab({ url: '/pages/vendor/dashboard/index' });
    });
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/auth/register/index' });
  },

  doLogin(afterLogin) {
    if (this.data.loggingIn) {
      return;
    }
    this.setData({ loggingIn: true });
    login({ force: true })
      .then(() => {
        wx.showToast({ title: '登录成功' });
        afterLogin();
      })
      .catch((error) => {
        wx.showToast({ title: error.message || '登录失败', icon: 'none' });
      })
      .finally(() => this.setData({ loggingIn: false }));
  }
});
