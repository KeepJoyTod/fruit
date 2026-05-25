const app = getApp();

Page({
  data: {
    saving: false,
    announcement: "",
    updatedText: ""
  },

  onShow() {
    const shop = app.globalData.shop || {};
    this.setData({
      announcement: shop.announcement || "",
      updatedText: shop.announcementUpdateTime ? "已发布" : "尚未发布"
    });
  },

  onAnnouncementInput(event) {
    this.setData({
      announcement: event.detail.value
    });
  },

  validateForm() {
    if (!app.globalData.shop || !app.globalData.shop._id) {
      return "请先完成商家登录";
    }

    if (!this.data.announcement.trim()) {
      return "请填写公告内容";
    }

    if (this.data.announcement.trim().length > 200) {
      return "公告最多200个字";
    }

    return "";
  },

  async publish() {
    if (this.data.saving) {
      return;
    }

    const errorMessage = this.validateForm();
    if (errorMessage) {
      wx.showToast({
        title: errorMessage,
        icon: "none"
      });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({
      title: "发布中"
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "publishAnnouncement",
        data: {
          shopId: app.globalData.shop._id,
          announcement: this.data.announcement
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "公告发布失败");
      }

      app.globalData.shop = data.shop;
      app.globalData.shouldRefreshHomeFruits = true;

      this.setData({
        announcement: data.shop.announcement || "",
        updatedText: "刚刚发布"
      });

      wx.showToast({
        title: "已发布",
        icon: "success"
      });
    } catch (error) {
      console.error("publish announcement failed", error);
      wx.showToast({
        title: error.message || "公告发布失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({ saving: false });
    }
  },

  clearDraft() {
    this.setData({
      announcement: ""
    });
  }
});
