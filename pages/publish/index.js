const app = getApp();
const { TAGS } = require("../../utils/constants");

const MAX_DETAIL_IMAGES = 9;

function createEmptySpec() {
  return {
    name: "",
    weight: "",
    price: "",
    stock: ""
  };
}

Page({
  data: {
    tags: TAGS,
    categories: [],
    selectedTagMap: {},
    selectedCategoryMap: {},
    saving: false,
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
      console.error("load publish categories failed", error);
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
        "form.mainImageTemp": file.tempFilePath,
        "form.mainImage": ""
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
    const remainCount = MAX_DETAIL_IMAGES - this.data.detailImageTemps.length;

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
        detailImageTemps: this.data.detailImageTemps.concat(paths).slice(0, MAX_DETAIL_IMAGES)
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

  removeDetailImage(event) {
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
      return "";
    }

    return this.uploadImage(this.data.form.mainImageTemp, "main");
  },

  async uploadDetailImages() {
    const paths = this.data.detailImageTemps || [];
    const uploaded = [];

    for (const path of paths) {
      uploaded.push(await this.uploadImage(path, "detail"));
    }

    return uploaded;
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

    if (!this.data.form.mainImageTemp && !this.data.form.mainImage) {
      return "请选择商品主图";
    }

    const validSpecs = this.data.form.specs.filter((spec) => spec.name && Number(spec.price) > 0);
    if (validSpecs.length === 0) {
      return "请至少填写一个有效规格";
    }

    if (!app.globalData.shop || !app.globalData.shop._id) {
      return "请先完成商家登录";
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
      const mainImage = this.data.form.mainImage || (await this.uploadMainImage());
      const detailImages = await this.uploadDetailImages();

      const result = await wx.cloud.callFunction({
        name: "createFruit",
        data: {
          shopId: app.globalData.shop._id,
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
        throw new Error((data && data.message) || "保存商品失败");
      }

      wx.showToast({
        title: "保存成功",
        icon: "success"
      });

      app.globalData.shouldRefreshHomeFruits = true;
      wx.navigateBack();
    } catch (error) {
      console.error("createFruit failed", error);
      wx.showToast({
        title: error.message || "保存商品失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({ saving: false });
    }
  }
});
