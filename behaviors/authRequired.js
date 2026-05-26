const store = require("../utils/store");
const navigation = require("../utils/navigation");
const ui = require("../utils/ui");

module.exports = Behavior({
  methods: {
    getRequiredShopId() {
      return store.getShopId();
    },

    getRequiredShop() {
      return store.getShop();
    },

    requireShopLogin(options) {
      const requestOptions = options || {};
      const shopId = store.getShopId();

      if (shopId) {
        return true;
      }

      if (requestOptions.toast !== false) {
        ui.showToast(requestOptions.message || "请先登录");
      }

      navigation.redirectTo(requestOptions.url || "/pages/login/index");
      return false;
    }
  }
});
