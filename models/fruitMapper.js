const {
  getMinPrice,
  formatPrice,
  buildFruitGallery,
  normalizeImageList,
  pickFruitMainImage
} = require("../utils/fruit");

function normalizePublicFruit(fruit) {
  return {
    ...fruit,
    mainImage: pickFruitMainImage(fruit),
    minPriceValue: typeof fruit.minPrice !== "undefined" ? Number(fruit.minPrice || 0) : getMinPrice(fruit && fruit.specs)
  };
}

function normalizeMerchantFruit(fruit) {
  const specs = Array.isArray(fruit && fruit.specs) ? fruit.specs : [];
  const totalStock = specs.reduce((sum, spec) => sum + Number(spec && spec.stock ? spec.stock : 0), 0);
  const status = (fruit && fruit.status) || "on_sale";

  return {
    ...fruit,
    mainImage: pickFruitMainImage(fruit),
    status,
    statusText: status === "off_sale" ? "已下架" : "上架中",
    statusClass: status === "off_sale" ? "off" : "on",
    nextStatus: status === "off_sale" ? "on_sale" : "off_sale",
    statusActionText: status === "off_sale" ? "上架" : "下架",
    specCount: specs.length,
    totalStock,
    isLowStock: totalStock > 0 && totalStock <= 5,
    minPrice: formatPrice(getMinPrice(specs))
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

function normalizeDetailSpec(spec) {
  return {
    ...spec,
    weightText: spec && spec.weight ? spec.weight : "未填写重量",
    stockNumber: Number((spec && spec.stock) || 0),
    priceText: formatPrice(spec && spec.price)
  };
}

function normalizeFruitDetail(fruit) {
  const specs = ((fruit && fruit.specs) || []).map((spec) => normalizeDetailSpec(spec));
  const detailImages = normalizeImageList(fruit && fruit.detailImages);
  const normalizedFruit = {
    ...fruit,
    mainImage: pickFruitMainImage(fruit),
    categoryIds: (fruit && fruit.categoryIds) || [],
    tags: (fruit && fruit.tags) || [],
    detailImages,
    specs
  };
  const galleryImages = buildFruitGallery(normalizedFruit);
  const defaultSpecIndex = specs.findIndex((spec) => spec.stockNumber > 0);
  const selectedSpecIndex = defaultSpecIndex >= 0 ? defaultSpecIndex : 0;

  return {
    fruit: normalizedFruit,
    specs,
    minPrice: formatPrice(getMinPrice(specs)),
    galleryImages,
    currentImage: galleryImages[0] || "",
    selectedSpecIndex,
    selectedSpec: specs[selectedSpecIndex] || null,
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
