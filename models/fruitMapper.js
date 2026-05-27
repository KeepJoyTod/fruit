const {
  getMinSkuPrice,
  getTotalSkuStock,
  getSkuStockSummary,
  getStockState,
  hasLowSkuStock,
  formatPrice,
  buildFruitGallery,
  normalizeImageList,
  pickFruitMainImage,
  normalizeSkuData
} = require("../utils/fruit");

function normalizePublicFruit(fruit) {
  const skuData = normalizeSkuData(fruit);

  return {
    ...fruit,
    mainImage: pickFruitMainImage(fruit),
    specGroups: skuData.specGroups,
    skus: skuData.skus,
    minPriceValue: typeof fruit.minPrice !== "undefined" ? Number(fruit.minPrice || 0) : getMinSkuPrice(skuData.skus)
  };
}

function normalizeMerchantFruit(fruit) {
  const skuData = normalizeSkuData(fruit);
  const totalStock = getTotalSkuStock(skuData.skus);
  const stockSummary = getSkuStockSummary(skuData.skus);
  const status = (fruit && fruit.status) || "on_sale";

  return {
    ...fruit,
    mainImage: pickFruitMainImage(fruit),
    status,
    statusText: status === "off_sale" ? "已下架" : "上架中",
    statusClass: status === "off_sale" ? "off" : "on",
    nextStatus: status === "off_sale" ? "on_sale" : "off_sale",
    statusActionText: status === "off_sale" ? "上架" : "下架",
    specCount: skuData.skus.length,
    totalStock,
    stockSummary,
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

function normalizeFruitDetail(fruit) {
  const skuData = normalizeSkuData(fruit);
  const specs = ((fruit && fruit.specs) || []).map((spec) => ({
    ...spec,
    weightText: spec && spec.weight ? spec.weight : "未填写重量",
    stockNumber: getStockState(spec && spec.stock).number || 0,
    stockText: getStockState(spec && spec.stock).text,
    priceText: formatPrice(spec && spec.price)
  }));
  const skus = skuData.skus.map((sku) => normalizeDetailSku(sku));
  const detailImages = normalizeImageList(fruit && fruit.detailImages);
  const normalizedFruit = {
    ...fruit,
    mainImage: pickFruitMainImage(fruit),
    categoryIds: (fruit && fruit.categoryIds) || [],
    tags: (fruit && fruit.tags) || [],
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
