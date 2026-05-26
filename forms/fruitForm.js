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
  const specs = Array.isArray(fruit && fruit.specs) && fruit.specs.length > 0 ? fruit.specs : [createEmptySpec()];
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
      specs
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
  return Object.assign({}, extra || {}, {
    name: form.name,
    mainImage: form.mainImage,
    detailImages: form.detailImages,
    origin: form.origin,
    description: form.description,
    categoryIds: form.categoryIds,
    tags: form.tags,
    status: form.status,
    specs: form.specs
  });
}

module.exports = {
  MAX_DETAIL_IMAGES,
  createEmptySpec,
  createEmptyFruitForm,
  mapSelectedValues,
  buildEditFruitState,
  toggleSelectedMap,
  validateFruitForm,
  buildFruitPayload
};
