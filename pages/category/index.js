const { TAGS } = require("../../utils/constants");
const fruitService = require("../../services/fruitService");
const { normalizePublicFruit } = require("../../models/fruitMapper");
const { loadPublicCategories } = require("../../utils/category");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");

function getCachedCategory(categoryId) {
  const app = getApp();
  return (app.globalData.categoryMap || {})[categoryId] || null;
}

Page({
  data: {
    categoryId: "",
    loading: false,
    loaded: false,
    tags: TAGS,
    selectedTag: "",
    category: null,
    fruits: [],
    displayFruits: [],
    sortKey: "default"
  },

  onLoad(options) {
    this.setData({
      categoryId: options.id || ""
    });

    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    if (!this.data.categoryId) {
      ui.showToast("缺少分类信息");
      this.setData({
        loaded: true,
        category: null,
        fruits: [],
        displayFruits: []
      });
      return;
    }

    this.setData({
      loading: true,
      loaded: false
    });

    try {
      let category = getCachedCategory(this.data.categoryId);
      const requests = [
        fruitService.listPublicFruits({
          categoryId: this.data.categoryId,
          tag: this.data.selectedTag,
          page: 1,
          pageSize: 50
        })
      ];

      if (!category) {
        requests.unshift(loadPublicCategories());
      }

      const results = await Promise.all(requests);
      const fruitsData = results[results.length - 1];

      if (!category) {
        const categories = results[0] || [];
        category = categories.find((item) => item._id === this.data.categoryId) || null;
      }

      const fruits = (fruitsData.fruits || []).map((fruit) => normalizePublicFruit(fruit));

      this.setData({
        category,
        fruits,
        loaded: true
      });

      this.applySort(this.data.sortKey, fruits);

      if (category) {
        wx.setNavigationBarTitle({
          title: category.name || "分类"
        });
      }
    } catch (error) {
      console.error("load category page failed", error);
      ui.showError(error, "加载失败");
      this.setData({
        loaded: true,
        category: null,
        fruits: [],
        displayFruits: []
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  applySort(sortKey = this.data.sortKey, sourceFruits = this.data.fruits) {
    const displayFruits = (sourceFruits || []).slice();

    if (sortKey === "priceAsc") {
      displayFruits.sort((left, right) => left.minPriceValue - right.minPriceValue);
    } else if (sortKey === "priceDesc") {
      displayFruits.sort((left, right) => right.minPriceValue - left.minPriceValue);
    }

    this.setData({
      sortKey,
      displayFruits
    });
  },

  changeSort(event) {
    const { sort } = event.currentTarget.dataset;

    if (!sort) {
      return;
    }

    this.applySort(sort);
  },

  selectTag(event) {
    const { tag = "" } = event.currentTarget.dataset;

    if (tag === this.data.selectedTag) {
      return;
    }

    this.setData({
      selectedTag: tag
    });
    this.loadData();
  },

  goSearch() {
    navigation.navigateToSearch();
  },

  goDetail(event) {
    const { fruit } = event.detail;
    navigation.navigateToFruitDetail(fruit._id);
  }
});
