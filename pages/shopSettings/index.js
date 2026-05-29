const shopService = require("../../services/shopService");
const { chooseImages, uploadImage, isChooseCancel } = require("../../utils/upload");
const store = require("../../utils/store");
const authRequired = require("../../behaviors/authRequired");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");
const { createShopForm, validateShopForm, buildShopPayload } = require("../../forms/shopForm");

Page({
  behaviors: [authRequired],

  data: {
    saving: false,
    form: createShopForm(store.getShop())
  },

  onShow() {
    if (!this.requireShopLogin()) {
      return;
    }

    this.setData({
      form: createShopForm(store.getShop())
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
      const paths = await chooseImages({ count: 1 });
      const filePath = paths[0];

      if (!filePath) {
        return;
      }

      this.setData({
        "form.logoTemp": filePath
      });
    } catch (error) {
      if (isChooseCancel(error)) {
        return;
      }

      console.error("choose shop logo failed", error);
      ui.showToast("选择图片失败");
    }
  },

  async uploadLogo() {
    if (!this.data.form.logoTemp) {
      return this.data.form.logo;
    }

    return uploadImage(this.data.form.logoTemp, {
      root: "shops",
      ownerId: this.getRequiredShopId() || "unknown",
      folder: "logo"
    });
  },

  validateForm() {
    return validateShopForm(this.data.form, this.getRequiredShopId());
  },

  async submit() {
    if (this.data.saving) {
      return;
    }

    const errorMessage = this.validateForm();
    if (errorMessage) {
      ui.showToast(errorMessage);
      return;
    }

    this.setData({ saving: true });
    ui.showLoading("保存中");

    try {
      const logo = await this.uploadLogo();
      const data = await shopService.updateShop(
        buildShopPayload(this.data.form, this.getRequiredShopId(), logo)
      );

      store.setShop(data.shop);
      store.markHomeFruitsChanged();

      this.setData({
        form: createShopForm(data.shop)
      });

      ui.showSuccess("已保存");
      navigation.redirectToMerchantHome();
    } catch (error) {
      console.error("update shop failed", error);
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      ui.showError(error, "店铺保存失败");
    } finally {
      ui.hideLoading();
      this.setData({ saving: false });
    }
  }
});
