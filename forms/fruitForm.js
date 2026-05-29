const {
  createId,
  normalizeImageList,
  pickFruitMainImage,
  normalizeSkuData,
  buildSkusFromGroups,
  buildLegacySpecsFromSkus,
  normalizeSpecGroups,
  normalizeSkus
} = require("../utils/fruit");
const { normalizeImageList, pickFruitMainImage } = require("../utils/fruit");

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

function createEmptyFruitForm() {
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
    specs: [createEmptySpec()]
  };
}

function mapSelectedValues(values) {
  return (values || []).reduce((map, value) => {
    map[value] = true;
    return map;
  }, {});
}

function buildEditFruitState(fruit) {
  const source = fruit || {};
  const skuData = normalizeSkuData(source);
  const specGroups = skuData.specGroups.length > 0 ? skuData.specGroups : createDefaultSpecGroups();
  const skus = skuData.skus.length > 0 ? skuData.skus : buildSkusFromGroups(specGroups, []);
  const mainImage = pickFruitMainImage(source);
  const detailImages = normalizeImageList(source.detailImages);

  return {
    displayImage: mainImage,
    detailImages,
    detailImageTemps: [],
    selectedTagMap: mapSelectedValues(source.tags),
    selectedCategoryMap: mapSelectedValues(source.categoryIds),
    form: {
      name: source.name || "",
      mainImage,
      mainImageTemp: "",
      origin: source.origin || "",
      description: source.description || "",
      tags: source.tags || [],
      categoryIds: source.categoryIds || [],
      status: source.status || "on_sale",
      specs: Array.isArray(source.specs) && source.specs.length > 0 ? source.specs : [createEmptySpec()],
      specGroups,
      skus
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
  const validSpecs = (form.specs || []).filter((spec) => spec.name && Number(spec.price) > 0);
  if (validSpecs.length === 0) {
    return "请至少填写一个有效规格";
  }

  if (validateOptions.requireShop && !validateOptions.shopId) {
    return "请先完成商家登录";
  }

  return "";
}

function buildFruitPayload(form, extra) {
  const specGroups = normalizeSpecGroups(form.specGroups);
  const skus = normalizeSkus(form.skus, specGroups);
  const specs = buildLegacySpecsFromSkus(specGroups, skus);

  return Object.assign(
    {
      name: form.name,
      mainImage: form.mainImage,
      detailImages: form.detailImages || [],
      origin: form.origin,
      description: form.description,
      categoryIds: form.categoryIds,
      tags: form.tags,
      status: form.status,
      specs,
      specGroups,
      skus
    },
    extra || {}
  );
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
