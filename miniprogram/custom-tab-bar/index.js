const app = getApp();

const CUSTOMER_TAB = {
  pagePath: 'pages/customer/home/index',
  text: '逛水果'
};

const VENDOR_TAB = {
  pagePath: 'pages/vendor/dashboard/index',
  text: '摊主管理'
};

Component({
  data: {
    list: []
  },

  lifetimes: {
    attached() {
      this.refresh();
    }
  },

  pageLifetimes: {
    show() {
      this.refresh();
    }
  },

  methods: {
    refresh() {
      const user = app.globalData.user || wx.getStorageSync('user') || null;
      const pages = getCurrentPages();
      const currentRoute = pages.length ? pages[pages.length - 1].route : '';
      const list = [CUSTOMER_TAB];
      if (user && user.role === 'VENDOR') {
        list.push(VENDOR_TAB);
      }
      this.setData({
        list: list.map((item) => ({
          ...item,
          selected: item.pagePath === currentRoute
        }))
      });
    },

    switchTab(event) {
      const path = event.currentTarget.dataset.path;
      if (!path) {
        return;
      }
      wx.switchTab({ url: `/${path}` });
    }
  }
});
