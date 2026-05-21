const { login, request } = require('../../../utils/request');

Page({
  data: {
    submitting: false,
    form: {
      stallName: '',
      address: '',
      latitude: '',
      longitude: '',
      phone: ''
    }
  },

  onLoad() {
    login().catch((error) => {
      wx.showToast({ title: error.message || '请先登录', icon: 'none' });
    });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
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
    request({
      url: '/vendor/profile',
      method: 'POST',
      data: {
        stallName: form.stallName.trim(),
        address: form.address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        phone: form.phone.trim()
      }
    }).then(() => {
      wx.showToast({ title: '注册成功' });
      wx.switchTab({ url: '/pages/vendor/dashboard/index' });
    }).finally(() => this.setData({ submitting: false }));
  }
});
