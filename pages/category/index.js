const { getMinPrice } = require("../../utils/fruit");
const { TAGS } = require("../../utils/constants");
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

function getCachedCategory(categoryId) {
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
      wx.showToast({
        title: "缺少分类信息",
        icon: "none"
      });
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
      const cachedCategory = getCachedCategory(this.data.categoryId);
      let category = cachedCategory;
      let categoryData = null;

      const requestList = [
        wx.cloud.callFunction({
          name: "listPublicFruits",
          data: {
            categoryId: this.data.categoryId,
            tag: this.data.selectedTag,
            page: 1,
            pageSize: 50
          }
        })
      ];

      if (!cachedCategory) {
        requestList.unshift(wx.cloud.callFunction({
          name: "listPublicCategories"
        }));
      }

      const results = await Promise.all(requestList);
      const fruitsResult = results[results.length - 1];
      const fruitsData = fruitsResult.result;

      if (!cachedCategory) {
        categoryData = results[0].result;

        if (!categoryData || !categoryData.success) {
          throw new Error((categoryData && categoryData.message) || "分类加载失败");
        }

        updateCategoryCache(categoryData.categories || []);
        category = (categoryData.categories || []).find((item) => item._id === this.data.categoryId) || null;
      }

      if (!fruitsData || !fruitsData.success) {
        throw new Error((fruitsData && fruitsData.message) || "商品加载失败");
      }

      const fruits = (fruitsData.fruits || []).map((fruit) => ({
        ...fruit,
        minPriceValue: typeof fruit.minPrice !== "undefined" ? Number(fruit.minPrice || 0) : getMinPrice(fruit.specs)
      }));

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
      wx.showToast({
        title: error.message || "加载失败",
        icon: "none"
      });
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
    wx.navigateTo({
      url: "/pages/search/index"
    });
  },

  goDetail(event) {
    const { fruit } = event.detail;
    wx.navigateTo({
      url: `/pages/detail/index?id=${fruit._id}`
    });
  }
});
