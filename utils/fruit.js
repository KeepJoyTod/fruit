function getMinPrice(specs) {
  if (!Array.isArray(specs) || specs.length === 0) {
    return 0;
  }

  return specs.reduce((min, spec) => {
    const price = Number(spec.price || 0);
    return min === 0 || price < min ? price : min;
  }, 0);
}

function formatPrice(price) {
  return Number(price || 0).toFixed(2);
}

function normalizeImageList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((item) => String(item || "").trim()).filter(Boolean);
}

function pickFruitMainImage(fruit) {
  const mainImage = String((fruit && fruit.mainImage) || "").trim();

  if (mainImage) {
    return mainImage;
  }

  return normalizeImageList(fruit && fruit.detailImages)[0] || "";
}

function buildFruitGallery(fruit) {
  const seen = {};
  return [pickFruitMainImage(fruit)]
    .concat(normalizeImageList(fruit && fruit.detailImages))
    .filter((url) => {
      if (!url || seen[url]) {
        return false;
      }

      seen[url] = true;
      return true;
    });
}

module.exports = {
  getMinPrice,
  formatPrice,
  normalizeImageList,
  pickFruitMainImage,
  buildFruitGallery
};
