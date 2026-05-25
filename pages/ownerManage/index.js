const app = getApp();

Page({
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

  redirectToMerchantHome() {
    wx.redirectTo({
      url: "/pages/merchant/index",
      fail: () => {
        wx.reLaunch({
          url: "/pages/merchant/index"
        });
      }
    });
  },

  showNotCreatorModal() {
    wx.showModal({
      title: "没有权限",
      content: "当前账号不是店主，不能管理团队成员。请联系店主处理。",
      showCancel: false,
      confirmText: "知道了",
      success: () => {
        this.redirectToMerchantHome();
      }
    });
  },

  async loadOwners() {
    const shop = app.globalData.shop;

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

    this.setData({ loading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: "listOwners",
        data: {
          shopId: shop._id
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "Owner 加载失败");
      }

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

      wx.showToast({
        title: error.message || "Owner 加载失败",
        icon: "none"
      });
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
    wx.showLoading({
      title: "生成中"
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "createInvite",
        data: {
          shopId: app.globalData.shop._id
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "邀请生成失败");
      }

      this.setData({
        inviteCode: data.code || "",
        invitePath: data.path || ""
      });

      wx.showToast({
        title: "已生成邀请",
        icon: "success"
      });
    } catch (error) {
      console.error("create invite failed", error);
      wx.showToast({
        title: error.message || "邀请生成失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({ creating: false });
    }
  },

  copyInvite() {
    if (!this.data.invitePath) {
      wx.showToast({
        title: "请先生成邀请链接",
        icon: "none"
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.invitePath
    });
  },

  onShareAppMessage() {
    const shop = app.globalData.shop || {};
    const path = this.data.invitePath || "/pages/login/index";

    return {
      title: `${shop.name || "水果小店"} 邀请你成为店铺 Owner`,
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
      wx.showToast({
        title: "店主不能被移除",
        icon: "none"
      });
      return;
    }

    wx.showModal({
      title: "移除 Owner",
      content: `确认移除“${name}”吗？`,
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
    wx.showLoading({
      title: "移除中"
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "removeOwner",
        data: {
          shopId: app.globalData.shop._id,
          ownerOpenid
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "移除失败");
      }

      wx.showToast({
        title: "已移除",
        icon: "success"
      });
      this.loadOwners();
    } catch (error) {
      console.error("remove owner failed", error);
      wx.showToast({
        title: error.message || "移除失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
    }
  }
});
