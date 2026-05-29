const ownerService = require("../../services/ownerService");
const store = require("../../utils/store");
const authRequired = require("../../behaviors/authRequired");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");

Page({
  behaviors: [authRequired],

  data: {
    loading: false,
    creating: false,
    isCreator: false,
    owners: [],
    inviteCode: "",
    invitePath: ""
  },

  onShow() {
    this.loadOwners();
  },

  showNotCreatorModal() {
    wx.showModal({
      title: "没有权限",
      content: "当前账号不是店主，不能管理团队成员。请联系店主处理。",
      showCancel: false,
      confirmText: "知道了",
      success: () => {
        navigation.redirectToMerchantHome();
      }
    });
  },

  async loadOwners() {
    if (!this.requireShopLogin()) {
      return;
    }

    this.setData({ loading: true });

    try {
      const data = await ownerService.listOwners(store.getShopId());

      if (!data.isCreator) {
        this.setData({
          owners: [],
          isCreator: false,
          inviteCode: "",
          invitePath: ""
        });
        this.showNotCreatorModal();
        return;
      }

      this.setData({
        owners: (data.owners || []).map((owner) => ({
          ...owner,
          initial: (owner.displayName || "管").slice(0, 1)
        })),
        isCreator: true
      });
    } catch (error) {
      console.error("load owners failed", error);
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      if (error && error.message && error.message.includes("不是店主")) {
        this.showNotCreatorModal();
        return;
      }

      ui.showError(error, "团队加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  async createInvite() {
    if (!this.data.isCreator) {
      this.showNotCreatorModal();
      return;
    }

    if (this.data.creating) {
      return;
    }

    this.setData({ creating: true });
    ui.showLoading("生成中");

    try {
      const data = await ownerService.createInvite(store.getShopId());

      this.setData({
        inviteCode: data.code || "",
        invitePath: data.path || ""
      });

      ui.showSuccess("已生成邀请");
    } catch (error) {
      console.error("create invite failed", error);
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      ui.showError(error, "邀请生成失败");
    } finally {
      ui.hideLoading();
      this.setData({ creating: false });
    }
  },

  copyInvite() {
    if (!this.data.invitePath) {
      ui.showToast("请先生成邀请链接");
      return;
    }

    wx.setClipboardData({
      data: this.data.invitePath
    });
  },

  },

  onShow() {
    this.loadOwners();
  },

  showNotCreatorModal() {
    wx.showModal({
      title: "没有权限",
      content: "当前账号不是店主，不能管理团队成员。请联系店主处理。",
      showCancel: false,
      confirmText: "知道了",
      success: () => {
        navigation.redirectToMerchantHome();
      }
    });
  },

  async loadOwners() {
    if (!this.requireShopLogin()) {
      return;
    }

    this.setData({ loading: true });

    try {
      const data = await ownerService.listOwners(store.getShopId());

      if (!data.isCreator) {
        this.setData({
          owners: [],
          isCreator: false,
          inviteCode: "",
          invitePath: ""
        });
        this.showNotCreatorModal();
        return;
      }

      this.setData({
        owners: (data.owners || []).map((owner) => ({
          ...owner,
          initial: (owner.displayName || "O").slice(0, 1)
        })),
        isCreator: true
      });
    } catch (error) {
      console.error("load owners failed", error);
      if (error && error.message && error.message.includes("不是店主")) {
        this.showNotCreatorModal();
        return;
      }

      ui.showError(error, "团队加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  async createInvite() {
    if (!this.data.isCreator) {
      this.showNotCreatorModal();
      return;
    }

    if (this.data.creating) {
      return;
    }

    this.setData({ creating: true });
    ui.showLoading("生成中");

    try {
      const data = await ownerService.createInvite(store.getShopId());

      this.setData({
        inviteCode: data.code || "",
        invitePath: data.path || ""
      });

      ui.showSuccess("已生成邀请");
    } catch (error) {
      console.error("create invite failed", error);
      ui.showError(error, "邀请生成失败");
    } finally {
      ui.hideLoading();
      this.setData({ creating: false });
    }
  },

  copyInvite() {
    if (!this.data.invitePath) {
      ui.showToast("请先生成邀请链接");
      return;
    }

    wx.setClipboardData({
      data: this.data.invitePath
    });
  },

  onShareAppMessage() {
    const shop = store.getShop() || {};
    const path = this.data.invitePath || "/pages/login/index";

    return {
      title: `${shop.name || "水果小店"} 邀请你成为店铺管理员`,
      path,
      imageUrl: shop.logo || ""
    };
  },

  confirmRemove(event) {
    if (!this.data.isCreator) {
      this.showNotCreatorModal();
      return;
    }

    const { openid, name, removable } = event.currentTarget.dataset;

    if (!removable) {
      ui.showToast("店主不能被移除");
      return;
    }

    wx.showModal({
      title: "移除管理员",
      content: `确认移除"${name}"吗？`,
      confirmText: "移除",
      confirmColor: "#b91c1c",
      success: (result) => {
        if (result.confirm) {
          this.removeOwner(openid);
        }
      }
    });
  },

  async removeOwner(ownerOpenid) {
    ui.showLoading("移除中");

    try {
      await ownerService.removeOwner(store.getShopId(), ownerOpenid);

      ui.showSuccess("已移除");
      this.loadOwners();
    } catch (error) {
      console.error("remove owner failed", error);
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      ui.showError(error, "移除失败");
    } finally {
      ui.hideLoading();
    }
  }
});
