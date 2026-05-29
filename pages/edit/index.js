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
  createEmptySpecGroup,
  createEmptySpecValue,
  createEmptyFruitForm,
  buildEditFruitState,
  buildFruitPayload,
  toggleSelectedMap,
  validateFruitForm
} = require("../../forms/fruitForm");
const { buildSkusFromGroups } = require("../../utils/fruit");
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
      this.handleShopAccessDenied(error);
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
      if (this.handleShopAccessDenied(error)) {
        return;
      }

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

  syncSkus(specGroups) {
    return buildSkusFromGroups(specGroups, this.data.form.skus);
  },

  getSpecGroupIndex(specGroups, groupId) {
    return specGroups.findIndex((group) => group.id === groupId);
  },

  getSpecValueIndex(values, valueId) {
    return values.findIndex((value) => value.id === valueId);
  },

  onSpecGroupNameInput(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const specGroups = this.data.form.specGroups.slice();
    const groupIndex = this.getSpecGroupIndex(specGroups, groupId);

    if (groupIndex < 0) {
      return;
    }

    specGroups[groupIndex] = Object.assign({}, specGroups[groupIndex], {
      name: event.detail.value
    });

    this.setData({
      "form.specGroups": specGroups,
      "form.skus": this.syncSkus(specGroups)
    });
  },

  onSpecValueInput(event) {
    const { groupId, valueId } = event.currentTarget.dataset;
    const specGroups = this.data.form.specGroups.map((group) => ({
      ...group,
      values: group.values.slice()
    }));
    const groupIndex = this.getSpecGroupIndex(specGroups, groupId);

    if (groupIndex < 0) {
      return;
    }

    const valueIndex = this.getSpecValueIndex(specGroups[groupIndex].values, valueId);
    if (valueIndex < 0) {
      return;
    }

    specGroups[groupIndex].values[valueIndex] = Object.assign({}, specGroups[groupIndex].values[valueIndex], {
      name: event.detail.value
    });

    this.setData({
      "form.specGroups": specGroups,
      "form.skus": this.syncSkus(specGroups)
    });
  },

  addSpecGroup() {
    const specGroups = this.data.form.specGroups.concat(createEmptySpecGroup(""));
    this.setData({
      "form.specGroups": specGroups,
      "form.skus": this.syncSkus(specGroups)
    });
  },

  removeSpecGroup(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const specGroups = this.data.form.specGroups.slice();
    const groupIndex = this.getSpecGroupIndex(specGroups, groupId);

    if (groupIndex < 0) {
      return;
    }
  toggleTag(event) {
    const tag = event.currentTarget.dataset.tag;
    const selectedTagMap = toggleSelectedMap(this.data.selectedTagMap, tag);

    specGroups.splice(groupIndex, 1);
    this.setData({
      "form.specGroups": specGroups,
      "form.skus": this.syncSkus(specGroups)
    });
  },

  addSpecValue(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const specGroups = this.data.form.specGroups.map((group) => ({
      ...group,
      values: group.values.slice()
    }));
    const groupIndex = this.getSpecGroupIndex(specGroups, groupId);

    if (groupIndex < 0) {
      return;
    }
  toggleCategory(event) {
    const categoryId = event.currentTarget.dataset.id;
    const selectedCategoryMap = toggleSelectedMap(this.data.selectedCategoryMap, categoryId);

    specGroups[groupIndex].values.push(createEmptySpecValue());

    this.setData({
      "form.specGroups": specGroups,
      "form.skus": this.syncSkus(specGroups)
    });
  },

  removeSpecValue(event) {
    const { groupId, valueId } = event.currentTarget.dataset;
    const specGroups = this.data.form.specGroups.map((group) => ({
      ...group,
      values: group.values.slice()
    }));
    const groupIndex = this.getSpecGroupIndex(specGroups, groupId);

    if (groupIndex < 0) {
      return;
    }

    const valueIndex = this.getSpecValueIndex(specGroups[groupIndex].values, valueId);
    if (valueIndex < 0) {
      return;
    }

    specGroups[groupIndex].values.splice(valueIndex, 1);

    this.setData({
      "form.specGroups": specGroups,
      "form.skus": this.syncSkus(specGroups)
    });
  },

  onSkuInput(event) {
    const { index, field } = event.currentTarget.dataset;
    const skus = this.data.form.skus.slice();
    skus[index] = Object.assign({}, skus[index], {
      [field]: event.detail.value
    });

    this.setData({
      "form.skus": skus
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

      await fruitService.updateFruit(buildFruitPayload(this.data.form, {
        fruitId: this.data.fruitId,
        mainImage,
        detailImages
      }));
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
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      ui.showError(error, "保存失败");
    } finally {
      ui.hideLoading();
      this.setData({ saving: false });
    }
  }
});
