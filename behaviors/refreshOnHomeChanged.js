const eventBus = require("../utils/eventBus");
const store = require("../utils/store");

module.exports = Behavior({
  lifetimes: {
    attached() {
      this.offHomeFruitsChanged = eventBus.on(store.EVENTS.homeFruitsChanged, () => {
        if (typeof this.onHomeFruitsChanged === "function") {
          this.onHomeFruitsChanged();
        }
      });
    },

    detached() {
      if (this.offHomeFruitsChanged) {
        this.offHomeFruitsChanged();
        this.offHomeFruitsChanged = null;
      }
    }
  },

  methods: {
    shouldRefreshHomeFruits() {
      return store.shouldRefreshHomeFruits();
    },

    clearHomeFruitsChanged() {
      store.clearHomeFruitsChanged();
    }
  }
});
