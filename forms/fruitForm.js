const {
  createId,
  normalizeImageList,
  pickFruitMainImage,
  normalizeSkuData,
  buildSkusFromGroups,
  normalizeSpecGroups,
  normalizeSkus
} = require("../utils/fruit");

const MAX_DETAIL_IMAGES = 9;

function createEmptySpec() {
  return {
    name: "",
    weight: "",
    price: "",
    stock: ""
  };
}

function createEmptySpecValue() {
  return {
    id: createId("value"),
    name: ""
  };
}

function createEmptySpecGroup(name) {
  return {
    id: createId("group"),
    name: name || "",
    values: [createEmptySpecValue()]
  };
}

function createDefaultSpecGroups() {
  return [createEmptySpecGroup("规格")];
}

function createEmptyFruitForm() {
  const specGroups = createDefaultSpecGroups();

  return {
    name: "",
    mainImage: "",
    mainImageTemp: "",
    origin: "",
    description: "",
    tags: [],
    categoryIds: [],
    status: "on_sale",
    specs: [createEmptySpec()],
    specGroups,
    skus: buildSkusFromGroups(specGroups, [])
  };
}

function mapSelectedValues(values) {
  return (values || []).reduce((map, value) => {
    map[value] = true;
    return map;
  }, {});
}

function buildEditFruitState(fruit) {
  const specs = Array.isArray(fruit && fruit.specs) && fruit.specs.length > 0 ? fruit.specs : [createEmptySpec()];
  const skuData = normalizeSkuData(fruit);
  const mainImage = pickFruitMainImage(fruit);
  const detailImages = normalizeImageList(fruit && fruit.detailImages);

  return {
    displayImage: mainImage,
    detailImages,
    detailImageTemps: [],
    selectedTagMap: mapSelectedValues(fruit && fruit.tags),
    selectedCategoryMap: mapSelectedValues(fruit && fruit.categoryIds),
    form: {
      name: (fruit && fruit.name) || "",
      mainImage,
      mainImageTemp: "",
      origin: (fruit && fruit.origin) || "",
      description: (fruit && fruit.description) || "",
      tags: (fruit && fruit.tags) || [],
      categoryIds: (fruit && fruit.categoryIds) || [],
      status: (fruit && fruit.status) || "on_sale",
      specs,
      specGroups: skuData.specGroups.length > 0 ? skuData.specGroups : createDefaultSpecGroups(),
      skus: skuData.skus.length > 0 ? skuData.skus : buildSkusFromGroups(skuData.specGroups, [])
    }
  };
}

function toggleSelectedMap(selectedMap, value) {
  const nextMap = Object.assign({}, selectedMap);

  if (nextMap[value]) {
    delete nextMap[value];
  } else {
    nextMap[value] = true;
  }

  return nextMap;
}

function validateFruitForm(options) {
  const validateOptions = options || {};
  const form = validateOptions.form || {};
  const hasMainImage = Boolean(validateOptions.hasMainImage);

  if (!String(form.name || "").trim()) {
    return "请填写商品名称";
  }

  if (!hasMainImage) {
    return "请选择商品主图";
  }

  const specGroups = normalizeSpecGroups(form.specGroups);
  const skus = normalizeSkus(form.skus, specGroups);
  if (specGroups.length === 0) {
    return "请至少填写一个规格项";
  }

  if (skus.length === 0) {
    return "请至少填写一个有效SKU";
  }

  if (validateOptions.requireShop && !validateOptions.shopId) {
    return "请先完成商家登录";
  }

  return "";
}

function buildFruitPayload(form, extra) {
  const specGroups = normalizeSpecGroups(form.specGroups);

  return Object.assign({
    name: form.name,
    mainImage: form.mainImage,
    detailImages: form.detailImages,
    origin: form.origin,
    description: form.description,
    categoryIds: form.categoryIds,
    tags: form.tags,
    status: form.status,
    specs: form.specs,
    specGroups,
    skus: normalizeSkus(form.skus, specGroups)
  }, extra || {});
}

module.exports = {
  MAX_DETAIL_IMAGES,
  createEmptySpec,
  createEmptySpecValue,
  createEmptySpecGroup,
  createDefaultSpecGroups,
  createEmptyFruitForm,
  mapSelectedValues,
  buildEditFruitState,
  toggleSelectedMap,
  validateFruitForm,
  buildFruitPayload
};
