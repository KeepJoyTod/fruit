const app = getApp();
const { getMinPrice, formatPrice } = require("../../utils/fruit");

Page({
  data: {
    shopName: app.globalData.shopName,
    shopInitial: "店",
    shopLogo: app.globalData.shopLogo,
    businessStatus: "open",
    announcement: "",
    role: "",
    roleText: "",
    filter: "all",
    fruits: [],
    filteredFruits: [],
    stats: {
      total: 0,
      onSale: 0,
      offSale: 0,
      lowStock: 0
    },
    managementItems: [
      { key: "publish", label: "新增商品", icon: "+", tone: "amber" },
      { key: "category", label: "分类管理", icon: "#", tone: "green" },
      { key: "shop", label: "店铺设置", icon: "店", tone: "blue" },
      { key: "announcement", label: "公告编辑", icon: "告", tone: "purple" },
      { key: "owner", label: "团队管理", icon: "人", tone: "orange" }
    ]
  },

  onShow() {
    const { user, shop, shopName, shopLogo } = app.globalData;

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
      shopName: shop.name || shopName,
      shopInitial: (shop.name || shopName || "店").slice(0, 1),
      shopLogo: shop.logo || shopLogo,
      businessStatus: shop.businessStatus || "open",
      announcement: shop.announcement || "",
      role: user && user.role ? user.role : "",
      roleText: user && user.role ? ` · ${user.role}` : ""
    });

    this.loadFruits();
  },

  async loadFruits() {
    const shop = app.globalData.shop;

    if (!shop || !shop._id) {
      this.setData({ fruits: [], filteredFruits: [] });
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

      const fruits = (data.fruits || []).map((fruit) => this.normalizeFruit(fruit));

      this.setData({
        fruits,
        stats: this.buildStats(fruits)
      });
      this.applyFilter();
    } catch (error) {
      console.error("load fruits failed", error);
      wx.showToast({
        title: error.message || "商品加载失败",
        icon: "none"
      });
    }
  },

  normalizeFruit(fruit) {
    const specs = Array.isArray(fruit.specs) ? fruit.specs : [];
    const totalStock = specs.reduce((sum, spec) => sum + Number(spec && spec.stock ? spec.stock : 0), 0);
    const status = fruit.status || "on_sale";

    return {
      ...fruit,
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
  },

  buildStats(fruits) {
    return fruits.reduce(
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
  },

  applyFilter() {
    const { filter, fruits } = this.data;
    const filteredFruits = fruits.filter((fruit) => {
      if (filter === "on_sale") {
        return fruit.status !== "off_sale";
      }
      if (filter === "off_sale") {
        return fruit.status === "off_sale";
      }
      if (filter === "low_stock") {
        return fruit.isLowStock;
      }
      return true;
    });

    this.setData({ filteredFruits });
  },

  switchFilter(event) {
    const filter = event.currentTarget.dataset.filter || "all";
    this.setData({ filter });
    this.applyFilter();
  },

  handleManagementTap(event) {
    const key = event.currentTarget.dataset.key;

    if (key === "publish") {
      this.goPublish();
    } else if (key === "category") {
      this.goCategoryManage();
    } else if (key === "shop") {
      this.goShopSettings();
    } else if (key === "announcement") {
      this.goAnnouncementManage();
    } else if (key === "owner") {
      this.goOwnerManage();
    } else {
      wx.showToast({
        title: "该功能稍后接入",
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

  async toggleStatus(event) {
    const { id, status } = event.currentTarget.dataset;

    if (!id || !status) {
      return;
    }

    wx.showLoading({
      title: "更新中"
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "updateFruitStatus",
        data: {
          fruitId: id,
          status
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "状态更新失败");
      }

      app.globalData.shouldRefreshHomeFruits = true;
      await this.loadFruits();
      wx.showToast({
        title: status === "off_sale" ? "已下架" : "已上架",
        icon: "success"
      });
    } catch (error) {
      console.error("update fruit status failed", error);
      wx.showToast({
        title: error.message || "状态更新失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
    }
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

  goShopSettings() {
    wx.navigateTo({
      url: "/pages/shopSettings/index"
    });
  },

  goAnnouncementManage() {
    wx.navigateTo({
      url: "/pages/announcementManage/index"
    });
  },

  goOwnerManage() {
    wx.navigateTo({
      url: "/pages/ownerManage/index"
    });
  }
});
