const { TAGS } = require("../../utils/constants");
const fruitService = require("../../services/fruitService");
const shopService = require("../../services/shopService");
const { loadPublicCategories } = require("../../utils/category");
const store = require("../../utils/store");
const refreshOnHomeChanged = require("../../behaviors/refreshOnHomeChanged");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");

Page({
  behaviors: [refreshOnHomeChanged],

  data: {
    shopName: store.getShopName(),
    shopInitial: "店",
    shopLogo: store.getShopLogo(),
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

  onHomeFruitsChanged() {
    this.loadData();
  },

  onShow() {
    if (this.data.hasLoaded && !this.shouldRefreshHomeFruits()) {
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
      this.clearHomeFruitsChanged();
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
      const data = await shopService.getPublicShop();

      if (!data.shop) {
        return;
      }

      const shop = data.shop;
      store.setShop(shop);
      store.setPublicShopInfo(shop);

      this.setData({
        shopName: shop.name || store.getShopName(),
        shopInitial: (shop.name || store.getShopName() || "店").slice(0, 1),
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
      const categories = await loadPublicCategories();
      this.setData({
        categories
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
      const data = await fruitService.listPublicFruits({
        tag: this.data.selectedTag,
        page: 1,
        pageSize: 20
      });

      this.setData({
        fruits: data.fruits || []
      });
    } catch (error) {
      console.error("load public fruits failed", error);
      ui.showError(error, "商品加载失败");
    }
  },

  goSearch() {
    navigation.navigateToSearch();
  },

  goLogin() {
    navigation.navigateToLogin();
  },

  goCategory(event) {
    const { id } = event.currentTarget.dataset;
    navigation.navigateToCategory(id);
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
    navigation.navigateToFruitDetail(fruit._id);
  }
});
