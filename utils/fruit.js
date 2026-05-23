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

module.exports = {
  getMinPrice,
  formatPrice
};
