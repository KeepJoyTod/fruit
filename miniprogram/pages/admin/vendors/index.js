const { request } = require('../../../utils/request');

Page({
  data: {
    loading: false,
    vendors: []
  },

  onShow() {
    this.loadVendors();
  },

  onPullDownRefresh() {
    this.loadVendors().finally(() => wx.stopPullDownRefresh());
  },

  loadVendors() {
    this.setData({ loading: true });
    return request({ url: '/admin/vendors' })
      .then((vendors) => this.setData({ vendors: vendors || [] }))
      .catch((error) => {
        wx.showToast({ title: error.message || '加载失败', icon: 'none' });
      })
      .finally(() => this.setData({ loading: false }));
  },

  toggleEnabled(event) {
    const id = event.currentTarget.dataset.id;
    const enabled = event.currentTarget.dataset.enabled;
    if (!id) {
      return;
    }
    request({
      url: `/admin/vendors/${id}/enabled`,
      method: 'POST',
      data: { enabled: !enabled }
    }).then(() => {
      wx.showToast({ title: enabled ? '已停用' : '已启用' });
      this.loadVendors();
    });
  }
});
