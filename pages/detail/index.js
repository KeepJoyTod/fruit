const fruitService = require("../../services/fruitService");
const { normalizeFruitDetail } = require("../../models/fruitMapper");
const { getSkuKey } = require("../../utils/fruit");
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
    minPrice: "￥0.00",
    galleryImages: [],
    currentImage: "",
    currentImageIndex: 0,
    selectedSpecIndex: 0,
    selectedSpec: null,
    selectedSkuIndex: 0,
    selectedSku: null,
    selectedSpecValueMap: {},
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
      const selectedSpecValueMap = this.buildSelectedSpecValueMap(detailState.fruit, detailState.selectedSku);
      detailState.fruit.specGroups = this.buildDisplaySpecGroups(detailState.fruit, selectedSpecValueMap);

      this.setData({
        fruit: detailState.fruit,
        minPrice: detailState.minPrice,
        galleryImages: detailState.galleryImages,
        currentImage: detailState.currentImage,
        currentImageIndex: 0,
        selectedSpecIndex: detailState.selectedSpecIndex,
        selectedSpec: detailState.selectedSpec,
        selectedSkuIndex: detailState.selectedSkuIndex,
        selectedSku: detailState.selectedSku,
        selectedSpecValueMap,
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
        selectedSkuIndex: 0,
        selectedSku: null,
        selectedSpecValueMap: {},
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

  buildSelectedSpecValueMap(fruit, sku) {
    const map = {};
    const groups = fruit && fruit.specGroups ? fruit.specGroups : [];
    const specValueIds = sku && Array.isArray(sku.specValueIds) ? sku.specValueIds : [];

    groups.forEach((group, index) => {
      if (specValueIds[index]) {
        map[group.id] = specValueIds[index];
      }
    });

    return map;
  },

  findSkuBySelectedMap(selectedSpecValueMap) {
    const fruit = this.data.fruit;
    const groups = fruit && fruit.specGroups ? fruit.specGroups : [];
    const selectedIds = groups.map((group) => selectedSpecValueMap[group.id]).filter(Boolean);

    if (!fruit || selectedIds.length !== groups.length) {
      return {
        sku: null,
        index: -1
      };
    }

    const key = getSkuKey(selectedIds);
    const skus = fruit.skus || [];
    const index = skus.findIndex((sku) => getSkuKey(sku.specValueIds) === key);

    return {
      sku: index >= 0 ? skus[index] : null,
      index
    };
  },

  isSpecValueDisabled(fruit, selectedSpecValueMap, groupId, valueId) {
    const groups = fruit && fruit.specGroups ? fruit.specGroups : [];
    const selectedMap = Object.assign({}, selectedSpecValueMap, {
      [groupId]: valueId
    });
    const selectedIds = groups.map((group) => selectedMap[group.id]).filter(Boolean);

    return !(fruit.skus || []).some((sku) => {
      return sku.isAvailable && selectedIds.every((id) => sku.specValueIds.indexOf(id) >= 0);
    });
  },

  buildDisplaySpecGroups(fruit, selectedSpecValueMap) {
    const groups = fruit && fruit.specGroups ? fruit.specGroups : [];

    return groups.map((group) => ({
      ...group,
      values: (group.values || []).map((value) => ({
        ...value,
        selected: selectedSpecValueMap[group.id] === value.id,
        disabled: this.isSpecValueDisabled(fruit, selectedSpecValueMap, group.id, value.id)
      }))
    }));
  },

  selectSpecValue(event) {
    const { groupId, valueId } = event.currentTarget.dataset;

    if (!groupId || !valueId || this.isSpecValueDisabled(this.data.fruit, this.data.selectedSpecValueMap, groupId, valueId)) {
      return;
    }

    const selectedSpecValueMap = Object.assign({}, this.data.selectedSpecValueMap, {
      [groupId]: valueId
    });
    const matched = this.findSkuBySelectedMap(selectedSpecValueMap);

    this.setData({
      selectedSpecValueMap,
      selectedSpecIndex: matched.index >= 0 ? matched.index : this.data.selectedSpecIndex,
      selectedSpec: matched.sku || this.data.selectedSpec,
      selectedSkuIndex: matched.index,
      selectedSku: matched.sku,
      "fruit.specGroups": this.buildDisplaySpecGroups(this.data.fruit, selectedSpecValueMap)
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
    const spec = this.data.selectedSku || this.data.selectedSpec;

    if (!fruit || !spec) {
      ui.showToast("暂无规格信息");
      return;
    }

    wx.setClipboardData({
      data: `${fruit.name} ${spec.specText || spec.name || ""} ${spec.priceText} 库存${spec.stockText || spec.stockNumber}`
    });
  },

  onShareAppMessage() {
    const fruit = this.data.fruit;

    return {
      title: fruit && fruit.name ? `${fruit.name} ${this.data.minPrice} 起` : "水果详情",
      path: `/pages/detail/index?id=${this.data.fruitId}`,
      imageUrl: fruit && fruit.mainImage ? fruit.mainImage : ""
    };
  },

  onShareTimeline() {
    const fruit = this.data.fruit;

    return {
      title: fruit && fruit.name ? `${fruit.name} ${this.data.minPrice} 起` : "水果详情",
      query: `id=${this.data.fruitId}`,
      imageUrl: fruit && fruit.mainImage ? fruit.mainImage : ""
    };
  }
});
