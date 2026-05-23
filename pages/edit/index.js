const app = getApp();
const { TAGS } = require("../../utils/constants");

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

Page({
  data: {
    tags: TAGS,
    fruitId: "",
    formReady: false,
    saving: false,
    selectedTagMap: {},
    displayImage: "",
    form: {
      name: "",
      mainImage: "",
      mainImageTemp: "",
      origin: "",
      description: "",
      tags: [],
      specs: [createEmptySpec()]
    }
  },

  onLoad(options) {
    this.setData({
      fruitId: options.id || ""
    });

    this.loadFruit();
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
          fruitId: this.data.fruitId
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "商品加载失败");
      }

      const fruit = data.fruit;
      const specs = Array.isArray(fruit.specs) && fruit.specs.length > 0 ? fruit.specs : [createEmptySpec()];

      this.setData({
        formReady: true,
        displayImage: fruit.mainImage || "",
        selectedTagMap: mapSelectedTags(fruit.tags),
        form: {
          name: fruit.name || "",
          mainImage: fruit.mainImage || "",
          mainImageTemp: "",
          origin: fruit.origin || "",
          description: fruit.description || "",
          tags: fruit.tags || [],
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

  async uploadMainImage() {
    if (!this.data.form.mainImageTemp) {
      return this.data.form.mainImage;
    }

    const extMatch = this.data.form.mainImageTemp.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : ".jpg";
    const shopId = app.globalData.shop && app.globalData.shop._id ? app.globalData.shop._id : "unknown";
    const cloudPath = `fruits/${shopId}/${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
    const result = await wx.cloud.uploadFile({
      cloudPath,
      filePath: this.data.form.mainImageTemp
    });

    return result.fileID;
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
      const result = await wx.cloud.callFunction({
        name: "updateFruit",
        data: {
          fruitId: this.data.fruitId,
          name: this.data.form.name,
          mainImage,
          origin: this.data.form.origin,
          description: this.data.form.description,
          tags: this.data.form.tags,
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
