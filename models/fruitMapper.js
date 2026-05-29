const {
  getMinSkuPrice,
  getTotalSkuStock,
  getSkuStockSummary,
  getStockState,
  hasLowSkuStock,
  formatPrice,
  getPriceNumber,
  buildFruitGallery,
  normalizeImageList,
  pickFruitMainImage,
  normalizeSkuData
} = require("../utils/fruit");

function normalizePublicFruit(fruit) {
  const source = fruit || {};
  const skuData = normalizeSkuData(source);

  return {
    ...source,
    mainImage: pickFruitMainImage(source),
    specGroups: skuData.specGroups,
    skus: skuData.skus,
    minPriceValue: getPriceNumber(typeof source.minPrice !== "undefined" ? source.minPrice : getMinSkuPrice(skuData.skus))
  };
}

function normalizeMerchantFruit(fruit) {
  const source = fruit || {};
  const skuData = normalizeSkuData(source);
  const totalStock = getTotalSkuStock(skuData.skus);
  const status = source.status || "on_sale";

  return {
    ...source,
    mainImage: pickFruitMainImage(source),
    status,
    statusText: status === "off_sale" ? "已下架" : "上架中",
    statusClass: status === "off_sale" ? "off" : "on",
    nextStatus: status === "off_sale" ? "on_sale" : "off_sale",
    statusActionText: status === "off_sale" ? "上架" : "下架",
    specGroups: skuData.specGroups,
    skus: skuData.skus,
    specCount: skuData.skus.length,
    totalStock,
    stockSummary: getSkuStockSummary(skuData.skus),
    isLowStock: hasLowSkuStock(skuData.skus),
    minPrice: formatPrice(getMinSkuPrice(skuData.skus))
  };
}

function buildMerchantFruitStats(fruits) {
  return (fruits || []).reduce(
    (stats, fruit) => {
      stats.total += 1;
      if (fruit.status === "off_sale") {
        stats.offSale += 1;
      } else {
        stats.onSale += 1;
      }
      if (fruit.isLowStock) {
        stats.lowStock += 1;
      }
      return stats;
    },
    {
      total: 0,
      onSale: 0,
      offSale: 0,
      lowStock: 0
    }
  );
}

function normalizeDetailSku(sku) {
  const stockState = getStockState(sku && sku.stock);

  return {
    ...sku,
    stockNumber: stockState.number === null ? 0 : stockState.number,
    stockText: stockState.text,
    isAvailable: stockState.isAvailable,
    isLowStock: stockState.isLowStock,
    priceText: formatPrice(sku && sku.price)
  };
}

function normalizeDetailSpec(spec) {
  const stockState = getStockState(spec && spec.stock);

  return {
    ...spec,
    weightText: spec && spec.weight ? spec.weight : "未填写重量",
    stockNumber: stockState.number === null ? 0 : stockState.number,
    stockText: stockState.text,
    priceText: formatPrice(spec && spec.price)
  };
}

function normalizeFruitDetail(fruit) {
  const source = fruit || {};
  const skuData = normalizeSkuData(source);
  const specs = (source.specs || []).map((spec) => normalizeDetailSpec(spec));
  const skus = skuData.skus.map((sku) => normalizeDetailSku(sku));
  const detailImages = normalizeImageList(source.detailImages);
  const normalizedFruit = {
    ...source,
    mainImage: pickFruitMainImage(source),
    categoryIds: source.categoryIds || [],
    tags: source.tags || [],
    detailImages,
    specs,
    specGroups: skuData.specGroups,
    skus
  };
  const galleryImages = buildFruitGallery(normalizedFruit);
  const defaultSkuIndex = skus.findIndex((sku) => sku.isAvailable);
  const selectedSkuIndex = defaultSkuIndex >= 0 ? defaultSkuIndex : 0;
  const selectedSku = skus[selectedSkuIndex] || null;

  return {
    fruit: normalizedFruit,
    specs,
    specGroups: skuData.specGroups,
    skus,
    minPrice: formatPrice(getMinSkuPrice(skus)),
    galleryImages,
    currentImage: galleryImages[0] || "",
    selectedSpecIndex: selectedSkuIndex,
    selectedSpec: selectedSku,
    selectedSkuIndex,
    selectedSku,
    detailImageItems: detailImages.map((url, index) => ({
      url,
      galleryIndex: galleryImages.indexOf(url),
      key: `${url}_${index}`
    }))
  };
}

module.exports = {
  normalizePublicFruit,
  normalizeMerchantFruit,
  buildMerchantFruitStats,
  normalizeFruitDetail
};
