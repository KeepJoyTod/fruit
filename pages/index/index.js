const app = getApp();
const { TAGS } = require("../../utils/constants");

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
    shopInitial: "店",
    shopLogo: app.globalData.shopLogo,
    announcement: "",
    contactPhone: "",
    address: "",
    businessStatus: "open",
    loading: false,
    hasLoaded: false,
    tags: TAGS,
    selectedTag: "",
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
      await Promise.all([this.loadShop(), this.loadCategories(), this.loadFruits()]);
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

  async loadShop() {
    try {
      const result = await wx.cloud.callFunction({
        name: "getPublicShop"
      });
      const data = result.result;

      if (!data || !data.success || !data.shop) {
        return;
      }

      const shop = data.shop;
      app.globalData.shopName = shop.name || app.globalData.shopName;
      app.globalData.shopLogo = shop.logo || "";

      this.setData({
        shopName: shop.name || app.globalData.shopName,
        shopInitial: (shop.name || app.globalData.shopName || "店").slice(0, 1),
        shopLogo: shop.logo || "",
        announcement: shop.announcement || "",
        contactPhone: shop.contactPhone || "",
        address: shop.address || "",
        businessStatus: shop.businessStatus || "open"
      });
    } catch (error) {
      console.error("load public shop failed", error);
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
          tag: this.data.selectedTag,
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

  selectTag(event) {
    const { tag = "" } = event.currentTarget.dataset;

    if (tag === this.data.selectedTag) {
      return;
    }

    this.setData({
      selectedTag: tag
    });
    this.loadFruits();
  },

  goDetail(event) {
    const { fruit } = event.detail;
    wx.navigateTo({
      url: `/pages/detail/index?id=${fruit._id}`
    });
  }
});
