const { request } = require('../../../utils/request');

Page({
  data: {
    allFruits: [],
    fruits: [],
    vendors: [],
    activeVendorId: '',
    activeTag: '',
    keyword: '',
    loading: false,
    statusText: {
      ON_SALE: '在售',
      LIMITED: '少量',
      SOLD_OUT: '售罄'
    }
  },

  onShow() {
    this.refreshTabBar();
    this.loadPageData();
  },

  refreshTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().refresh();
    }
  },

  onPullDownRefresh() {
    this.loadPageData().finally(() => wx.stopPullDownRefresh());
  },

  loadPageData() {
    this.setData({ loading: true });
    return Promise.all([this.loadVendors(), this.loadFruits()])
      .finally(() => this.setData({ loading: false }));
  },

  loadVendors() {
    return request({ url: '/vendors', auth: false })
      .then((vendors) => this.setData({ vendors }))
      .catch(() => this.setData({ vendors: [] }));
  },

  loadFruits() {
    const params = [];
    if (this.data.activeTag) {
      params.push(`tag=${encodeURIComponent(this.data.activeTag)}`);
    }
    if (this.data.activeVendorId) {
      params.push(`vendorId=${this.data.activeVendorId}`);
    }
    const query = params.length ? `?${params.join('&')}` : '';
    request({ url: `/fruits${query}`, auth: false })
      .then((fruits) => {
        this.setData({ allFruits: fruits || [] });
        this.applyKeyword();
      })
      .catch(() => this.setData({ allFruits: [], fruits: [] }));
  },

  changeTag(event) {
    this.setData({ activeTag: event.currentTarget.dataset.tag || '' });
    this.loadFruits();
  },

  changeVendor(event) {
    this.setData({ activeVendorId: event.currentTarget.dataset.id || '' });
    this.loadFruits();
  },

  onSearchInput(event) {
    this.setData({ keyword: event.detail.value });
    this.applyKeyword();
  },

  clearSearch() {
    this.setData({ keyword: '' });
    this.applyKeyword();
  },

  applyKeyword() {
    const keyword = this.data.keyword.trim().toLowerCase();
    const fruits = keyword
      ? this.data.allFruits.filter((fruit) => {
          const fields = [fruit.name, fruit.description, ...(fruit.tags || [])].join(' ').toLowerCase();
          return fields.includes(keyword);
        })
      : this.data.allFruits;
    this.setData({ fruits });
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/customer/detail/index?id=${event.currentTarget.dataset.id}`
    });
  }
});
