const app = getApp();
const { TAGS } = require("../../utils/constants");
const { normalizeImageList, pickFruitMainImage } = require("../../utils/fruit");

const MAX_DETAIL_IMAGES = 9;

function createEmptySpec() {
  return {
    name: "",
    weight: "",
    price: "",
    stock: ""
  };
}

function mapSelectedTags(tags) {
  return (tags || []).reduce((map, tag) => {
    map[tag] = true;
    return map;
  }, {});
}

function mapSelectedCategories(categoryIds) {
  return (categoryIds || []).reduce((map, categoryId) => {
    map[categoryId] = true;
    return map;
  }, {});
}

Page({
  data: {
    tags: TAGS,
    categories: [],
    fruitId: "",
    formReady: false,
    saving: false,
    selectedTagMap: {},
    selectedCategoryMap: {},
    displayImage: "",
    detailImages: [],
    detailImageTemps: [],
    form: {
      name: "",
      mainImage: "",
      mainImageTemp: "",
      origin: "",
      description: "",
      tags: [],
      categoryIds: [],
      status: "on_sale",
      specs: [createEmptySpec()]
    }
  },

  onLoad(options) {
    this.setData({
      fruitId: options.id || ""
    });

    this.loadFruit();
  },

  onShow() {
    this.loadCategories();
  },

  async loadCategories() {
    const shop = app.globalData.shop;

    if (!shop || !shop._id) {
      return;
    }

    try {
      const result = await wx.cloud.callFunction({
        name: "listMerchantCategories",
        data: {
          shopId: shop._id
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "分类加载失败");
      }

      this.setData({
        categories: data.categories || []
      });
    } catch (error) {
      console.error("load edit categories failed", error);
    }
  },

  async loadFruit() {
    if (!this.data.fruitId) {
      wx.showToast({
        title: "缺少商品信息",
        icon: "none"
      });
      return;
    }

    try {
      const result = await wx.cloud.callFunction({
        name: "getFruitDetail",
        data: {
          fruitId: this.data.fruitId,
          includeOffSale: true
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "商品加载失败");
      }

      const fruit = data.fruit;
      const specs = Array.isArray(fruit.specs) && fruit.specs.length > 0 ? fruit.specs : [createEmptySpec()];
      const mainImage = pickFruitMainImage(fruit);
      const detailImages = normalizeImageList(fruit.detailImages);

      this.setData({
        formReady: true,
        displayImage: mainImage,
        detailImages,
        detailImageTemps: [],
        selectedTagMap: mapSelectedTags(fruit.tags),
        selectedCategoryMap: mapSelectedCategories(fruit.categoryIds),
        form: {
          name: fruit.name || "",
          mainImage,
          mainImageTemp: "",
          origin: fruit.origin || "",
          description: fruit.description || "",
          tags: fruit.tags || [],
          categoryIds: fruit.categoryIds || [],
          status: fruit.status || "on_sale",
          specs
        }
      });
    } catch (error) {
      console.error("load edit fruit failed", error);
      wx.showToast({
        title: error.message || "商品加载失败",
        icon: "none"
      });
    }
  },

  onNameInput(event) {
    this.setData({
      "form.name": event.detail.value
    });
  },

  onDescriptionInput(event) {
    this.setData({
      "form.description": event.detail.value
    });
  },

  onOriginInput(event) {
    this.setData({
      "form.origin": event.detail.value
    });
  },

  async chooseMainImage() {
    try {
      const result = await wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        sizeType: ["compressed"]
      });
      const file = result.tempFiles && result.tempFiles[0];

      if (!file || !file.tempFilePath) {
        return;
      }

      this.setData({
        displayImage: file.tempFilePath,
        "form.mainImageTemp": file.tempFilePath
      });
    } catch (error) {
      if (error && error.errMsg && error.errMsg.includes("cancel")) {
        return;
      }

      console.error("choose image failed", error);
      wx.showToast({
        title: "选择图片失败",
        icon: "none"
      });
    }
  },

  async chooseDetailImages() {
    const remainCount = MAX_DETAIL_IMAGES - this.data.detailImages.length - this.data.detailImageTemps.length;

    if (remainCount <= 0) {
      wx.showToast({
        title: "最多上传9张详情图",
        icon: "none"
      });
      return;
    }

    try {
      const result = await wx.chooseMedia({
        count: remainCount,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        sizeType: ["compressed"]
      });
      const paths = (result.tempFiles || []).map((file) => file.tempFilePath).filter(Boolean);

      if (paths.length === 0) {
        return;
      }

      this.setData({
        detailImageTemps: this.data.detailImageTemps
          .concat(paths)
          .slice(0, MAX_DETAIL_IMAGES - this.data.detailImages.length)
      });
    } catch (error) {
      if (error && error.errMsg && error.errMsg.includes("cancel")) {
        return;
      }

      console.error("choose detail images failed", error);
      wx.showToast({
        title: "选择详情图失败",
        icon: "none"
      });
    }
  },

  removeExistingDetailImage(event) {
    const index = Number(event.currentTarget.dataset.index);
    const detailImages = this.data.detailImages.slice();
    detailImages.splice(index, 1);
    this.setData({ detailImages });
  },

  removeNewDetailImage(event) {
    const index = Number(event.currentTarget.dataset.index);
    const detailImageTemps = this.data.detailImageTemps.slice();
    detailImageTemps.splice(index, 1);
    this.setData({ detailImageTemps });
  },

  async uploadImage(filePath, folder) {
    const extMatch = filePath.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : ".jpg";
    const shopId = app.globalData.shop && app.globalData.shop._id ? app.globalData.shop._id : "unknown";
    const cloudPath = `fruits/${shopId}/${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
    const result = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    });

    return result.fileID;
  },

  async uploadMainImage() {
    if (!this.data.form.mainImageTemp) {
      return this.data.form.mainImage;
    }

    return this.uploadImage(this.data.form.mainImageTemp, "main");
  },

  async uploadDetailImages() {
    const uploaded = [];

    for (const path of this.data.detailImageTemps) {
      uploaded.push(await this.uploadImage(path, "detail"));
    }

    return this.data.detailImages.concat(uploaded).slice(0, MAX_DETAIL_IMAGES);
  },

  onSpecInput(event) {
    const { index, field } = event.currentTarget.dataset;
    const specs = this.data.form.specs.slice();
    specs[index][field] = event.detail.value;

    this.setData({
      "form.specs": specs
    });
  },

  addSpec() {
    this.setData({
      "form.specs": this.data.form.specs.concat(createEmptySpec())
    });
  },

  toggleTag(event) {
    const tag = event.currentTarget.dataset.tag;
    const selectedTagMap = Object.assign({}, this.data.selectedTagMap);

    if (selectedTagMap[tag]) {
      delete selectedTagMap[tag];
    } else {
      selectedTagMap[tag] = true;
    }

    this.setData({
      selectedTagMap,
      "form.tags": Object.keys(selectedTagMap)
    });
  },

  toggleCategory(event) {
    const categoryId = event.currentTarget.dataset.id;
    const selectedCategoryMap = Object.assign({}, this.data.selectedCategoryMap);

    if (selectedCategoryMap[categoryId]) {
      delete selectedCategoryMap[categoryId];
    } else {
      selectedCategoryMap[categoryId] = true;
    }

    this.setData({
      selectedCategoryMap,
      "form.categoryIds": Object.keys(selectedCategoryMap)
    });
  },

  validateForm() {
    if (!this.data.form.name.trim()) {
      return "请填写商品名称";
    }

    if (!this.data.displayImage) {
      return "请选择商品主图";
    }

    const validSpecs = this.data.form.specs.filter((spec) => spec.name && Number(spec.price) > 0);
    if (validSpecs.length === 0) {
      return "请至少填写一个有效规格";
    }

    return "";
  },

  async submit() {
    if (this.data.saving) {
      return;
    }

    const errorMessage = this.validateForm();
    if (errorMessage) {
      wx.showToast({
        title: errorMessage,
        icon: "none"
      });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({
      title: "保存中"
    });

    try {
      const mainImage = await this.uploadMainImage();
      const detailImages = await this.uploadDetailImages();
      const result = await wx.cloud.callFunction({
        name: "updateFruit",
        data: {
          fruitId: this.data.fruitId,
          name: this.data.form.name,
          mainImage,
          detailImages,
          origin: this.data.form.origin,
          description: this.data.form.description,
          categoryIds: this.data.form.categoryIds,
          tags: this.data.form.tags,
          status: this.data.form.status,
          specs: this.data.form.specs
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "保存失败");
      }

      wx.showToast({
        title: "已保存",
        icon: "success"
      });

      app.globalData.shouldRefreshHomeFruits = true;
      wx.navigateBack();
    } catch (error) {
      console.error("update fruit failed", error);
      wx.showToast({
        title: error.message || "保存失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({ saving: false });
    }
  }
});
