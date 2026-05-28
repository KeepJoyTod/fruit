const { TAGS } = require("../../utils/constants");
const fruitService = require("../../services/fruitService");
const { loadMerchantCategories } = require("../../utils/category");
const { chooseImages, uploadImage, uploadImages, isChooseCancel } = require("../../utils/upload");
const store = require("../../utils/store");
const authRequired = require("../../behaviors/authRequired");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");
const {
  MAX_DETAIL_IMAGES,
  createEmptySpec,
  createEmptyFruitForm,
  toggleSelectedMap,
  validateFruitForm
} = require("../../forms/fruitForm");

function getUploadShopId() {
  return store.getShopId() || "unknown";
}

Page({
  behaviors: [authRequired],

  data: {
    tags: TAGS,
    categories: [],
    selectedTagMap: {},
    selectedCategoryMap: {},
    saving: false,
    detailImageTemps: [],
    form: createEmptyFruitForm()
  },

  onShow() {
    if (!this.requireShopLogin()) {
      return;
    }

    this.loadCategories();
  },

  async loadCategories() {
    const shopId = this.getRequiredShopId();

    if (!shopId) {
      return;
    }

    try {
      const categories = await loadMerchantCategories(shopId);
      this.setData({ categories });
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
      const paths = await chooseImages({ count: 1 });
      const filePath = paths[0];

      if (!filePath) {
        return;
      }

      this.setData({
        "form.mainImageTemp": filePath,
        "form.mainImage": ""
      });
    } catch (error) {
      if (isChooseCancel(error)) {
        return;
      }

      console.error("choose image failed", error);
      ui.showToast("选择图片失败");
    }
  },

  async chooseDetailImages() {
    const remainCount = MAX_DETAIL_IMAGES - this.data.detailImageTemps.length;

    if (remainCount <= 0) {
      ui.showToast("最多上传9张详情图");
      return;
    }

    try {
      const paths = await chooseImages({ count: remainCount });

      if (paths.length === 0) {
        return;
      }

      this.setData({
        detailImageTemps: this.data.detailImageTemps.concat(paths).slice(0, MAX_DETAIL_IMAGES)
      });
    } catch (error) {
      if (isChooseCancel(error)) {
        return;
      }

      console.error("choose detail images failed", error);
      ui.showToast("选择详情图失败");
    }
  },

  removeDetailImage(event) {
    const index = Number(event.currentTarget.dataset.index);
    const detailImageTemps = this.data.detailImageTemps.slice();
    detailImageTemps.splice(index, 1);
    this.setData({ detailImageTemps });
  },

  uploadFruitImage(filePath, folder) {
    return uploadImage(filePath, {
      root: "fruits",
      ownerId: getUploadShopId(),
      folder
    });
  },

  async uploadMainImage() {
    if (!this.data.form.mainImageTemp) {
      return "";
    }

    return this.uploadFruitImage(this.data.form.mainImageTemp, "main");
  },

  uploadDetailImages() {
    return uploadImages(this.data.detailImageTemps, {
      root: "fruits",
      ownerId: getUploadShopId(),
      folder: "detail"
    });
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
    const selectedTagMap = toggleSelectedMap(this.data.selectedTagMap, tag);

    this.setData({
      selectedTagMap,
      "form.tags": Object.keys(selectedTagMap)
    });
  },

  toggleCategory(event) {
    const categoryId = event.currentTarget.dataset.id;
    const selectedCategoryMap = toggleSelectedMap(this.data.selectedCategoryMap, categoryId);

    this.setData({
      selectedCategoryMap,
      "form.categoryIds": Object.keys(selectedCategoryMap)
    });
  },

  validateForm() {
    return validateFruitForm({
      form: this.data.form,
      hasMainImage: Boolean(this.data.form.mainImageTemp || this.data.form.mainImage),
      requireShop: true,
      shopId: this.getRequiredShopId()
    });
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
      const mainImage = this.data.form.mainImage || (await this.uploadMainImage());
      const detailImages = await this.uploadDetailImages();

      await fruitService.createFruit({
        shopId: this.getRequiredShopId(),
        name: this.data.form.name,
        mainImage,
        detailImages,
        origin: this.data.form.origin,
        description: this.data.form.description,
        categoryIds: this.data.form.categoryIds,
        tags: this.data.form.tags,
        status: this.data.form.status,
        specs: this.data.form.specs
      });

      ui.showSuccess("保存成功");
      store.markHomeFruitsChanged();
      navigation.redirectToMerchantHome();
    } catch (error) {
      console.error("createFruit failed", error);
      ui.showError(error, "保存商品失败");
    } finally {
      ui.hideLoading();
      this.setData({ saving: false });
    }
  }
});
