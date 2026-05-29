const { register, request } = require('../../../utils/request');

Page({
  data: {
    submitting: false,
    form: {
      username: '',
      password: '',
      nickname: '',
      role: 'CUSTOMER',
      stallName: '',
      address: '',
      latitude: '',
      longitude: '',
      phone: ''
    }
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  changeRole(event) {
    this.setData({ 'form.role': event.currentTarget.dataset.role });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.address': res.address || res.name,
          'form.latitude': res.latitude,
          'form.longitude': res.longitude
        });
      }
    });
  },

  validateForm() {
    const form = this.data.form;
    if (!form.username.trim() || !form.password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return false;
    }
    if (form.password.length < 6) {
      wx.showToast({ title: '密码至少 6 位', icon: 'none' });
      return false;
    }
    if (form.role !== 'VENDOR') {
      return true;
    }
    if (!form.stallName.trim() || !form.address.trim() || !form.phone.trim()) {
      wx.showToast({ title: '请补全摊位资料', icon: 'none' });
      return false;
    }
    if (!Number(form.latitude) || !Number(form.longitude)) {
      wx.showToast({ title: '请选择或填写位置', icon: 'none' });
      return false;
    }
    return true;
  },

  submit() {
    if (this.data.submitting || !this.validateForm()) {
      return;
    }
    const form = this.data.form;
    this.setData({ submitting: true });
    register({
      username: form.username.trim(),
      password: form.password,
      nickname: form.nickname.trim(),
      role: form.role
    }).then(() => {
      if (form.role !== 'VENDOR') {
        wx.showToast({ title: '注册成功' });
        wx.switchTab({ url: '/pages/customer/home/index' });
        return null;
      }
      return request({
        url: '/vendor/profile',
        method: 'POST',
        data: {
          stallName: form.stallName.trim(),
          address: form.address.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          phone: form.phone.trim()
        }
      });
    }).then((vendorResult) => {
      if (vendorResult === null) {
        return;
      }
      wx.showToast({ title: '注册成功' });
      wx.switchTab({ url: '/pages/vendor/dashboard/index' });
    }).finally(() => this.setData({ submitting: false }));
  }
});
