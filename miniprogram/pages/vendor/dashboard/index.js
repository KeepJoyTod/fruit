const { request } = require('../../../utils/request');

Page({
  data: {
    vendor: {},
    profileForm: {
      stallName: '',
      address: '',
      latitude: '',
      longitude: '',
      phone: ''
    },
    editingProfile: false,
    dashboard: {},
    fruits: [],
    statusText: {
      ON_SALE: '在售',
      LIMITED: '少量',
      SOLD_OUT: '售罄'
    }
  },

  onShow() {
    this.loadAll();
  },

  loadAll() {
    this.loadVendor()
      .then((hasVendor) => {
        if (!hasVendor) {
          return;
        }
        this.loadDashboard();
        this.loadFruits();
      });
  },

  loadVendor() {
    return request({ url: '/vendor/profile', showErrorToast: false })
      .then((vendor) => {
        this.setData({
          vendor,
          editingProfile: false,
          profileForm: {
            stallName: vendor.stallName || '',
            address: vendor.address || '',
            latitude: vendor.latitude || '',
            longitude: vendor.longitude || '',
            phone: vendor.phone || ''
          }
        });
        return true;
      })
      .catch(() => {
        this.setData({
          vendor: {},
          editingProfile: true,
          dashboard: {},
          fruits: []
        });
        return false;
      });
  },

  loadDashboard() {
    request({ url: '/vendor/dashboard' })
      .then((dashboard) => this.setData({ dashboard }))
      .catch(() => {});
  },

  loadFruits() {
    request({ url: '/vendor/fruits' })
      .then((fruits) => this.setData({ fruits }))
      .catch(() => {});
  },

  setupDemoVendor() {
    request({
      url: '/vendor/profile',
      method: 'POST',
      data: {
        stallName: '老王鲜果摊',
        address: '学校东门临街 3 号摊位',
        latitude: 39.9087,
        longitude: 116.4713,
        phone: '13800138000'
      }
    }).then(() => {
      wx.showToast({ title: '已初始化' });
      this.loadAll();
    });
  },

  toggleProfileEdit() {
    this.setData({ editingProfile: !this.data.editingProfile });
  },

  onProfileInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`profileForm.${field}`]: event.detail.value });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'profileForm.address': res.address || res.name,
          'profileForm.latitude': res.latitude,
          'profileForm.longitude': res.longitude
        });
      }
    });
  },

  saveProfile() {
    const form = this.data.profileForm;
    if (!form.stallName || !form.address || !form.phone) {
      wx.showToast({ title: '请补全摊位资料', icon: 'none' });
      return;
    }
    request({
      url: '/vendor/profile',
      method: 'POST',
      data: {
        stallName: form.stallName,
        address: form.address,
        latitude: Number(form.latitude) || 39.9087,
        longitude: Number(form.longitude) || 116.4713,
        phone: form.phone
      }
    }).then(() => {
      wx.showToast({ title: '已保存' });
      this.setData({ editingProfile: false });
      this.loadAll();
    });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/vendor/fruit-form/index' });
  },

  goEdit(event) {
    wx.navigateTo({ url: `/pages/vendor/fruit-form/index?id=${event.currentTarget.dataset.id}` });
  },

  changeStatus(event) {
    request({
      url: `/fruits/${event.currentTarget.dataset.id}/status`,
      method: 'PATCH',
      data: { status: event.currentTarget.dataset.status }
    }).then(() => {
      wx.showToast({ title: '已更新' });
      this.loadAll();
    });
  },

  deleteFruit(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: '确认下架',
      content: '下架后顾客端将不再展示该水果。',
      confirmText: '下架',
      confirmColor: '#b42318',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        request({
          url: `/fruits/${id}`,
          method: 'DELETE'
        }).then(() => {
          wx.showToast({ title: '已下架' });
          this.loadAll();
        });
      }
    });
  }
});
