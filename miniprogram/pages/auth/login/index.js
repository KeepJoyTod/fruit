const { login } = require('../../../utils/request');

Page({
  data: {
    loggingIn: false,
    form: {
      username: '',
      password: ''
    }
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/auth/register/index' });
  },

  submit() {
    if (this.data.loggingIn) {
      return;
    }
    const form = this.data.form;
    if (!form.username.trim() || !form.password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    this.setData({ loggingIn: true });
    login({
      force: true,
      username: form.username.trim(),
      password: form.password
    })
      .then((user) => {
        wx.showToast({ title: '登录成功' });
        this.redirectByRole(user.role);
      })
      .catch((error) => {
        wx.showToast({ title: error.message || '登录失败', icon: 'none' });
      })
      .finally(() => this.setData({ loggingIn: false }));
  },

  redirectByRole(role) {
    if (role === 'SUPER_ADMIN') {
      wx.navigateTo({ url: '/pages/admin/vendors/index' });
      return;
    }
    if (role === 'VENDOR') {
      wx.switchTab({ url: '/pages/vendor/dashboard/index' });
      return;
    }
    wx.switchTab({ url: '/pages/customer/home/index' });
  }
});
