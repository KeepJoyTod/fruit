const app = getApp();
const { getMinPrice, formatPrice } = require("../../utils/fruit");

Page({
  data: {
    shopName: app.globalData.shopName,
    role: "",
    roleText: "",
    fruits: []
  },

  onShow() {
    const { user, shop, shopName } = app.globalData;

    if (!shop || !shop._id) {
      wx.showToast({
        title: "请先登录",
        icon: "none"
      });
      wx.redirectTo({
        url: "/pages/login/index"
      });
      return;
    }

    this.setData({
      shopName: shop && shop.name ? shop.name : shopName,
      role: user && user.role ? user.role : "",
      roleText: user && user.role ? ` · ${user.role}` : ""
    });

    this.loadFruits();
  },

  async loadFruits() {
    const shop = app.globalData.shop;

    if (!shop || !shop._id) {
      this.setData({ fruits: [] });
      return;
    }

    try {
      const result = await wx.cloud.callFunction({
        name: "listMerchantFruits",
        data: {
          shopId: shop._id
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "商品加载失败");
      }

      const fruits = data.fruits.map((fruit) => ({
        ...fruit,
        specCount: Array.isArray(fruit.specs) ? fruit.specs.length : 0,
        minPrice: formatPrice(getMinPrice(fruit.specs))
      }));

      this.setData({ fruits });
    } catch (error) {
      console.error("load fruits failed", error);
      wx.showToast({
        title: "商品加载失败",
        icon: "none"
      });
    }
  },

  goPublish() {
    wx.navigateTo({
      url: "/pages/publish/index"
    });
  },

  goEdit(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/edit/index?id=${id}`
    });
  },

  confirmDelete(event) {
    const { id, name } = event.currentTarget.dataset;

    wx.showModal({
      title: "删除商品",
      content: `确认删除“${name}”吗？`,
      confirmText: "删除",
      confirmColor: "#b91c1c",
      success: (result) => {
        if (result.confirm) {
          this.deleteFruit(id);
        }
      }
    });
  },

  async deleteFruit(fruitId) {
    wx.showLoading({
      title: "删除中"
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "deleteFruit",
        data: {
          fruitId
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "删除失败");
      }

      wx.showToast({
        title: "已删除",
        icon: "success"
      });

      app.globalData.shouldRefreshHomeFruits = true;
      this.loadFruits();
    } catch (error) {
      console.error("delete fruit failed", error);
      wx.showToast({
        title: error.message || "删除失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
    }
  },

  goCategoryManage() {
    wx.navigateTo({
      url: "/pages/categoryManage/index"
    });
  },

  goOwnerManage() {
    wx.navigateTo({
      url: "/pages/ownerManage/index"
    });
  }
});
