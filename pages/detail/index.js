const { getMinPrice, formatPrice, buildFruitGallery, normalizeImageList, pickFruitMainImage } = require("../../utils/fruit");
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

function getCachedRelatedCategories(categoryIds) {
  const categoryMap = app.globalData.categoryMap || {};
  return (categoryIds || []).map((id) => categoryMap[id]).filter(Boolean);
}

Page({
  data: {
    fruitId: "",
    loading: false,
    fruit: null,
    minPrice: "0.00",
    galleryImages: [],
    currentImage: "",
    currentImageIndex: 0,
    selectedSpecIndex: 0,
    selectedSpec: null,
    relatedCategories: [],
    detailImageItems: []
  },

  onLoad(options) {
    this.setData({
      fruitId: options.id || ""
    });

    if (wx.showShareMenu) {
      wx.showShareMenu({
        menus: ["shareAppMessage", "shareTimeline"]
      });
    }

    this.loadFruit();
  },

  onPullDownRefresh() {
    this.loadFruit().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadFruit() {
    if (!this.data.fruitId) {
      wx.showToast({
        title: "缺少商品信息",
        icon: "none"
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: "getFruitDetail",
        data: {
          fruitId: this.data.fruitId
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "商品加载失败");
      }

      const specs = (data.fruit.specs || []).map((spec) => ({
        ...spec,
        weightText: spec.weight || "未填写重量",
        stockNumber: Number(spec.stock || 0),
        priceText: formatPrice(spec.price)
      }));
      const detailImages = normalizeImageList(data.fruit.detailImages);
      const fruit = {
        ...data.fruit,
        mainImage: pickFruitMainImage(data.fruit),
        categoryIds: data.fruit.categoryIds || [],
        tags: data.fruit.tags || [],
        detailImages,
        specs
      };
      const galleryImages = buildFruitGallery(fruit);
      const defaultSpecIndex = specs.findIndex((spec) => spec.stockNumber > 0);
      const selectedSpecIndex = defaultSpecIndex >= 0 ? defaultSpecIndex : 0;

      this.setData({
        fruit,
        minPrice: formatPrice(getMinPrice(specs)),
        galleryImages,
        currentImage: galleryImages[0] || "",
        currentImageIndex: 0,
        selectedSpecIndex,
        selectedSpec: specs[selectedSpecIndex] || null,
        detailImageItems: fruit.detailImages.map((url, index) => ({
          url,
          galleryIndex: galleryImages.indexOf(url),
          key: `${url}_${index}`
        }))
      });

      await this.loadRelatedCategories(fruit.categoryIds);
    } catch (error) {
      console.error("load fruit detail failed", error);
      wx.showToast({
        title: error.message || "商品加载失败",
        icon: "none"
      });
      this.setData({
        fruit: null,
        galleryImages: [],
        currentImage: "",
        currentImageIndex: 0,
        selectedSpecIndex: 0,
        selectedSpec: null,
        relatedCategories: [],
        detailImageItems: []
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadRelatedCategories(categoryIds) {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      this.setData({
        relatedCategories: []
      });
      return;
    }

    const cachedCategories = getCachedRelatedCategories(categoryIds);
    if (cachedCategories.length === categoryIds.length) {
      this.setData({
        relatedCategories: cachedCategories
      });
      return;
    }

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
        relatedCategories: getCachedRelatedCategories(categoryIds)
      });
    } catch (error) {
      console.error("load related categories failed", error);
      this.setData({
        relatedCategories: []
      });
    }
  },

  selectSpec(event) {
    const index = Number(event.currentTarget.dataset.index);
    const spec = this.data.fruit && this.data.fruit.specs ? this.data.fruit.specs[index] : null;

    if (!spec) {
      return;
    }

    this.setData({
      selectedSpecIndex: index,
      selectedSpec: spec
    });
  },

  changePreview(event) {
    const index = Number(event.currentTarget.dataset.index);
    const currentImage = this.data.galleryImages[index];

    if (!currentImage) {
      return;
    }

    this.setData({
      currentImageIndex: index,
      currentImage
    });
  },

  previewImage(event) {
    const index = Number(event.currentTarget.dataset.index);
    const urls = this.data.galleryImages || [];
    const current = urls[index] || this.data.currentImage;

    if (!current) {
      return;
    }

    wx.previewImage({
      current,
      urls
    });
  },

  goCategory(event) {
    const { id } = event.currentTarget.dataset;

    if (!id) {
      return;
    }

    wx.navigateTo({
      url: `/pages/category/index?id=${id}`
    });
  },

  goPrimaryCategory() {
    const firstCategory = this.data.relatedCategories[0];

    if (!firstCategory) {
      wx.showToast({
        title: "暂无关联分类",
        icon: "none"
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/category/index?id=${firstCategory._id}`
    });
  },

  copyName() {
    const fruit = this.data.fruit;

    if (!fruit || !fruit.name) {
      return;
    }

    wx.setClipboardData({
      data: fruit.name
    });
  },

  copySpecInfo() {
    const fruit = this.data.fruit;
    const spec = this.data.selectedSpec;

    if (!fruit || !spec) {
      wx.showToast({
        title: "暂无规格信息",
        icon: "none"
      });
      return;
    }

    wx.setClipboardData({
      data: `${fruit.name} ${spec.name} ${spec.weightText} ￥${spec.priceText} 库存${spec.stockNumber}`
    });
  },

  onShareAppMessage() {
    const fruit = this.data.fruit;

    return {
      title: fruit && fruit.name ? `${fruit.name} ￥${this.data.minPrice} 起` : "水果详情",
      path: `/pages/detail/index?id=${this.data.fruitId}`,
      imageUrl: fruit && fruit.mainImage ? fruit.mainImage : ""
    };
  },

  onShareTimeline() {
    const fruit = this.data.fruit;

    return {
      title: fruit && fruit.name ? `${fruit.name} ￥${this.data.minPrice} 起` : "水果详情",
      query: `id=${this.data.fruitId}`,
      imageUrl: fruit && fruit.mainImage ? fruit.mainImage : ""
    };
  }
});
