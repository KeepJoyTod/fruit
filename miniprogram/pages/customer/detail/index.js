const { request } = require('../../../utils/request');

Page({
  data: {
    fruit: null,
    vendor: null,
    statusText: {
      ON_SALE: '在售',
      LIMITED: '少量',
      SOLD_OUT: '售罄'
    }
  },

  onLoad(options) {
    this.loadFruit(options.id);
  },

  onShareAppMessage() {
    const fruit = this.data.fruit || {};
    return {
      title: fruit.name ? `${fruit.name}正在上架` : '今日鲜果',
      path: `/pages/customer/detail/index?id=${fruit.id || ''}`
    };
  },

  loadFruit(id) {
    request({ url: `/fruits/${id}`, auth: false }).then((fruit) => {
      this.setData({ fruit });
      return request({ url: `/vendors/${fruit.vendorId}`, auth: false });
    }).then((vendor) => {
      this.setData({ vendor });
    });
  },

  callVendor() {
    wx.makePhoneCall({ phoneNumber: this.data.vendor.phone });
  },

  openMap() {
    const vendor = this.data.vendor;
    wx.openLocation({
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      name: vendor.stallName,
      address: vendor.address,
      scale: 18
    });
  },

  copyAddress() {
    wx.setClipboardData({
      data: this.data.vendor.address
    });
  }
});
