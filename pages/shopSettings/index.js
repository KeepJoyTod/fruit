const app = getApp();

function createForm(shop) {
  const source = shop || {};

  return {
    name: source.name || "",
    logo: source.logo || "",
    logoTemp: "",
    contactPhone: source.contactPhone || "",
    address: source.address || "",
    businessStatus: source.businessStatus || "open"
  };
}

Page({
  data: {
    saving: false,
    form: createForm(app.globalData.shop)
  },

  onShow() {
    this.setData({
      form: createForm(app.globalData.shop)
    });
  },

  onNameInput(event) {
    this.setData({
      "form.name": event.detail.value
    });
  },

  onContactPhoneInput(event) {
    this.setData({
      "form.contactPhone": event.detail.value
    });
  },

  onAddressInput(event) {
    this.setData({
      "form.address": event.detail.value
    });
  },

  switchBusinessStatus(event) {
    const status = event.currentTarget.dataset.status || "open";
    this.setData({
      "form.businessStatus": status
    });
  },

  async chooseLogo() {
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
        "form.logoTemp": file.tempFilePath
      });
    } catch (error) {
      if (error && error.errMsg && error.errMsg.includes("cancel")) {
        return;
      }

      console.error("choose shop logo failed", error);
      wx.showToast({
        title: "选择图片失败",
        icon: "none"
      });
    }
  },

  async uploadLogo() {
    if (!this.data.form.logoTemp) {
      return this.data.form.logo;
    }

    const shop = app.globalData.shop;
    const shopId = shop && shop._id ? shop._id : "unknown";
    const extMatch = this.data.form.logoTemp.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : ".jpg";
    const cloudPath = `shops/${shopId}/logo-${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
    const result = await wx.cloud.uploadFile({
      cloudPath,
      filePath: this.data.form.logoTemp
    });

    return result.fileID;
  },

  validateForm() {
    if (!app.globalData.shop || !app.globalData.shop._id) {
      return "请先完成商家登录";
    }

    if (!this.data.form.name.trim()) {
      return "请填写店铺名称";
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
      const logo = await this.uploadLogo();
      const result = await wx.cloud.callFunction({
        name: "updateShop",
        data: {
          shopId: app.globalData.shop._id,
          name: this.data.form.name,
          logo,
          contactPhone: this.data.form.contactPhone,
          address: this.data.form.address,
          businessStatus: this.data.form.businessStatus
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "店铺保存失败");
      }

      app.globalData.shop = data.shop;
      app.globalData.shopName = data.shop && data.shop.name ? data.shop.name : app.globalData.shopName;
      app.globalData.shopLogo = data.shop && data.shop.logo ? data.shop.logo : "";
      app.globalData.shouldRefreshHomeFruits = true;

      this.setData({
        form: createForm(data.shop)
      });

      wx.showToast({
        title: "已保存",
        icon: "success"
      });
    } catch (error) {
      console.error("update shop failed", error);
      wx.showToast({
        title: error.message || "店铺保存失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({ saving: false });
    }
  }
});
