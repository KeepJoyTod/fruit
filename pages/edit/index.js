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
  buildEditFruitState,
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
    fruitId: "",
    formReady: false,
    saving: false,
    selectedTagMap: {},
    selectedCategoryMap: {},
    displayImage: "",
    detailImages: [],
    detailImageTemps: [],
    form: createEmptyFruitForm()
  },

  onLoad(options) {
    this.setData({
      fruitId: options.id || ""
    });

    if (!this.requireShopLogin()) {
      return;
    }

    this.loadFruit();
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
      console.error("load edit categories failed", error);
    }
  },

  async loadFruit() {
    if (!this.data.fruitId) {
      ui.showToast("缺少商品信息");
      return;
    }

    try {
      const data = await fruitService.getFruitDetail({
        fruitId: this.data.fruitId,
        includeOffSale: true
      });
      const fruitState = buildEditFruitState(data.fruit);

      this.setData({
        formReady: true,
        displayImage: fruitState.displayImage,
        detailImages: fruitState.detailImages,
        detailImageTemps: fruitState.detailImageTemps,
        selectedTagMap: fruitState.selectedTagMap,
        selectedCategoryMap: fruitState.selectedCategoryMap,
        form: fruitState.form
      });
    } catch (error) {
      console.error("load edit fruit failed", error);
      ui.showError(error, "商品加载失败");
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
        displayImage: filePath,
        "form.mainImageTemp": filePath
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
    const remainCount = MAX_DETAIL_IMAGES - this.data.detailImages.length - this.data.detailImageTemps.length;

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
        detailImageTemps: this.data.detailImageTemps
          .concat(paths)
          .slice(0, MAX_DETAIL_IMAGES - this.data.detailImages.length)
      });
    } catch (error) {
      if (isChooseCancel(error)) {
        return;
      }

      console.error("choose detail images failed", error);
      ui.showToast("选择详情图失败");
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

  uploadFruitImage(filePath, folder) {
    return uploadImage(filePath, {
      root: "fruits",
      ownerId: getUploadShopId(),
      folder
    });
  },

  async uploadMainImage() {
    if (!this.data.form.mainImageTemp) {
      return this.data.form.mainImage;
    }

    return this.uploadFruitImage(this.data.form.mainImageTemp, "main");
  },

  async uploadDetailImages() {
    const uploaded = await uploadImages(this.data.detailImageTemps, {
      root: "fruits",
      ownerId: getUploadShopId(),
      folder: "detail"
    });

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
      hasMainImage: Boolean(this.data.displayImage)
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
      const mainImage = await this.uploadMainImage();
      const detailImages = await this.uploadDetailImages();
      await fruitService.updateFruit({
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
      });

      ui.showSuccess("已保存");
      store.markHomeFruitsChanged();
      navigation.redirectToMerchantHome();
    } catch (error) {
      console.error("update fruit failed", error);
      ui.showError(error, "保存失败");
    } finally {
      ui.hideLoading();
      this.setData({ saving: false });
    }
  }
});
