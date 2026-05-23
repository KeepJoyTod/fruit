const { getMinPrice, formatPrice } = require("../../utils/fruit");

Component({
  properties: {
    fruit: {
      type: Object,
      value: {}
    },
    showShopName: {
      type: Boolean,
      value: false
    }
  },

  data: {
    minPrice: "0.00"
  },

  observers: {
    fruit(fruit) {
      const minPrice = fruit && typeof fruit.minPrice !== "undefined"
        ? fruit.minPrice
        : getMinPrice(fruit && fruit.specs);

      this.setData({
        minPrice: formatPrice(minPrice)
      });
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent("tap", {
        fruit: this.properties.fruit
      });
    }
  }
});
