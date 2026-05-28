const fruitService = require("../../services/fruitService");
const { normalizeMerchantFruit, buildMerchantFruitStats } = require("../../models/fruitMapper");
const store = require("../../utils/store");
const authRequired = require("../../behaviors/authRequired");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");

const BASE_MANAGEMENT_ITEMS = [
  { key: "category", label: "分类管理", icon: "#", tone: "green" },
  { key: "shop", label: "店铺设置", icon: "店", tone: "blue" },
  { key: "announcement", label: "公告编辑", icon: "告", tone: "purple" }
];

const CREATOR_MANAGEMENT_ITEM = { key: "owner", label: "团队管理", icon: "人", tone: "orange" };

function getRoleText(role) {
  if (role === "creator") {
    return "店主";
  }

  if (role === "manager" || role === "owner") {
    return "管理员";
  }

  return "";
}

Page({
  behaviors: [authRequired],

  data: {
    shopName: store.getShopName(),
    shopInitial: "店",
    shopLogo: store.getShopLogo(),
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
    managementItems: BASE_MANAGEMENT_ITEMS
  },

  onShow() {
    if (!this.requireShopLogin()) {
      return;
    }

    const user = store.getUser();
    const shop = store.getShop();
    const role = user && user.role ? user.role : "";
    const isCreator = role === "creator" || shop.creatorId === (user && user.openid);
    const roleText = getRoleText(isCreator ? "creator" : role);
    const shopName = shop.name || store.getShopName();

    this.setData({
      shopName,
      shopInitial: (shopName || "店").slice(0, 1),
      shopLogo: shop.logo || store.getShopLogo(),
      businessStatus: shop.businessStatus || "open",
      announcement: shop.announcement || "",
      role,
      roleText: roleText ? ` · ${roleText}` : "",
      managementItems: isCreator ? BASE_MANAGEMENT_ITEMS.concat(CREATOR_MANAGEMENT_ITEM) : BASE_MANAGEMENT_ITEMS
    });

    this.loadFruits();
  },

  async loadFruits() {
    const shopId = store.getShopId();

    if (!shopId) {
      this.setData({ fruits: [], filteredFruits: [] });
      return;
    }

    try {
      const data = await fruitService.listMerchantFruits(shopId);
      const fruits = (data.fruits || []).map((fruit) => normalizeMerchantFruit(fruit));

      this.setData({
        fruits,
        stats: buildMerchantFruitStats(fruits)
      });
      this.applyFilter();
    } catch (error) {
      console.error("load fruits failed", error);
      ui.showError(error, "商品加载失败");
    }
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
      navigation.navigateToPublish();
    } else if (key === "category") {
      navigation.navigateToCategoryManage();
    } else if (key === "shop") {
      navigation.navigateToShopSettings();
    } else if (key === "announcement") {
      navigation.navigateToAnnouncementManage();
    } else if (key === "owner") {
      navigation.navigateToOwnerManage();
    }
  },

  goPublish() {
    navigation.navigateToPublish();
  },

  goEdit(event) {
    const { id } = event.currentTarget.dataset;
    navigation.navigateToEditFruit(id);
  },

  async toggleStatus(event) {
    const { id, status } = event.currentTarget.dataset;

    if (!id || !status) {
      return;
    }

    ui.showLoading("更新中");

    try {
      await fruitService.updateFruitStatus(id, status);

      store.markHomeFruitsChanged();
      await this.loadFruits();
      ui.showSuccess(status === "off_sale" ? "已下架" : "已上架");
    } catch (error) {
      console.error("update fruit status failed", error);
      ui.showError(error, "状态更新失败");
    } finally {
      ui.hideLoading();
    }
  },

  confirmDelete(event) {
    const { id, name } = event.currentTarget.dataset;

    wx.showModal({
      title: "删除商品",
      content: `确认删除"${name}"吗？`,
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
    ui.showLoading("删除中");

    try {
      await fruitService.deleteFruit(fruitId);

      ui.showSuccess("已删除");
      store.markHomeFruitsChanged();
      this.loadFruits();
    } catch (error) {
      console.error("delete fruit failed", error);
      ui.showError(error, "删除失败");
    } finally {
      ui.hideLoading();
    }
  },

  goCategoryManage() {
    navigation.navigateToCategoryManage();
  },

  goShopSettings() {
    navigation.navigateToShopSettings();
  },

  goAnnouncementManage() {
    navigation.navigateToAnnouncementManage();
  },

  goOwnerManage() {
    navigation.navigateToOwnerManage();
  }
});
