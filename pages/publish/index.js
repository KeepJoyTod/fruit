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
  buildFruitPayload,
  toggleSelectedMap,
  validateFruitForm
} = require("../../forms/fruitForm");
const { buildSkusFromGroups } = require("../../utils/fruit");

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
      this.handleShopAccessDenied(error);
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

      await fruitService.createFruit(buildFruitPayload(this.data.form, {
        shopId: this.getRequiredShopId(),
        mainImage,
        detailImages
      }));

      ui.showSuccess("保存成功");
      store.markHomeFruitsChanged();
      navigation.redirectToMerchantHome();
    } catch (error) {
      console.error("createFruit failed", error);
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      ui.showError(error, "保存商品失败");
    } finally {
      ui.hideLoading();
      this.setData({ saving: false });
    }
  }
});
