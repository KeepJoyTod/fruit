const app = getApp();

function updateCategoryCache(categories) {
  const list = Array.isArray(categories) ? categories : [];
  app.globalData.categories = list;
  app.globalData.categoryMap = list.reduce((map, item) => {
    if (item && item._id) {
      map[item._id] = item;
    }
    return map;
  }, {});
}

Page({
  data: {
    shopName: app.globalData.shopName,
    loading: false,
    hasLoaded: false,
    categories: [],
    fruits: []
  },

  onShow() {
    if (this.data.hasLoaded && !app.globalData.shouldRefreshHomeFruits) {
      return;
    }

    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      await Promise.all([this.loadCategories(), this.loadFruits()]);
      app.globalData.shouldRefreshHomeFruits = false;
      this.setData({
        hasLoaded: true
      });
    } catch (error) {
      console.error("load home data failed", error);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadCategories() {
    try {
      const result = await wx.cloud.callFunction({
        name: "listPublicCategories"
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "分类加载失败");
      }

      updateCategoryCache(data.categories || []);
      this.setData({
        categories: data.categories || []
      });
    } catch (error) {
      console.error("load categories failed", error);
      this.setData({
        categories: []
      });
    }
  },

  async loadFruits() {
    try {
      const result = await wx.cloud.callFunction({
        name: "listPublicFruits",
        data: {
          page: 1,
          pageSize: 20
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "商品加载失败");
      }

      this.setData({
        fruits: data.fruits || []
      });
    } catch (error) {
      console.error("load public fruits failed", error);
      wx.showToast({
        title: "商品加载失败",
        icon: "none"
      });
    }
  },

  goSearch() {
    wx.navigateTo({
      url: "/pages/search/index"
    });
  },

  goLogin() {
    wx.navigateTo({
      url: "/pages/login/index"
    });
  },

  goCategory(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/category/index?id=${id}`
    });
  },

  goDetail(event) {
    const { fruit } = event.detail;
    wx.navigateTo({
      url: `/pages/detail/index?id=${fruit._id}`
    });
  }
});
