const fruitService = require("../../services/fruitService");
const { normalizeFruitDetail } = require("../../models/fruitMapper");
const { loadPublicCategories } = require("../../utils/category");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");

function getCachedRelatedCategories(categoryIds) {
  const app = getApp();
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
      ui.showToast("缺少商品信息");
      return;
    }

    this.setData({ loading: true });

    try {
      const data = await fruitService.getFruitDetail({
        fruitId: this.data.fruitId
      });
      const detailState = normalizeFruitDetail(data.fruit);

      this.setData({
        fruit: detailState.fruit,
        minPrice: detailState.minPrice,
        galleryImages: detailState.galleryImages,
        currentImage: detailState.currentImage,
        currentImageIndex: 0,
        selectedSpecIndex: detailState.selectedSpecIndex,
        selectedSpec: detailState.selectedSpec,
        detailImageItems: detailState.detailImageItems
      });

      await this.loadRelatedCategories(detailState.fruit.categoryIds);
    } catch (error) {
      console.error("load fruit detail failed", error);
      ui.showError(error, "商品加载失败");
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
      await loadPublicCategories();

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

    navigation.navigateToCategory(id);
  },

  goPrimaryCategory() {
    const firstCategory = this.data.relatedCategories[0];

    if (!firstCategory) {
      ui.showToast("暂无关联分类");
      return;
    }

    navigation.navigateToCategory(firstCategory._id);
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
      ui.showToast("暂无规格信息");
      return;
    }

    wx.setClipboardData({
      data: `${fruit.name} ${spec.name} ${spec.weightText} ¥${spec.priceText} 库存${spec.stockNumber}`
    });
  },

  onShareAppMessage() {
    const fruit = this.data.fruit;

    return {
      title: fruit && fruit.name ? `${fruit.name} ¥${this.data.minPrice} 起` : "水果详情",
      path: `/pages/detail/index?id=${this.data.fruitId}`,
      imageUrl: fruit && fruit.mainImage ? fruit.mainImage : ""
    };
  },

  onShareTimeline() {
    const fruit = this.data.fruit;

    return {
      title: fruit && fruit.name ? `${fruit.name} ¥${this.data.minPrice} 起` : "水果详情",
      query: `id=${this.data.fruitId}`,
      imageUrl: fruit && fruit.mainImage ? fruit.mainImage : ""
    };
  }
});
