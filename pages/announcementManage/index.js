const announcementService = require("../../services/announcementService");
const store = require("../../utils/store");
const authRequired = require("../../behaviors/authRequired");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");

Page({
  behaviors: [authRequired],

  data: {
    saving: false,
    announcement: "",
    updatedText: ""
  },

  onShow() {
    if (!this.requireShopLogin()) {
      return;
    }

    const shop = store.getShop() || {};
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
    if (!store.getShopId()) {
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
      ui.showToast(errorMessage);
      return;
    }

    this.setData({ saving: true });
    ui.showLoading("发布中");

    try {
      const data = await announcementService.publishAnnouncement(store.getShopId(), this.data.announcement);

      store.setShop(data.shop);
      store.markHomeFruitsChanged();

      this.setData({
        announcement: data.shop.announcement || "",
        updatedText: "刚刚发布"
      });

      ui.showSuccess("已发布");
      navigation.redirectToMerchantHome();
    } catch (error) {
      console.error("publish announcement failed", error);
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      ui.showError(error, "公告发布失败");
    } finally {
      ui.hideLoading();
      this.setData({ saving: false });
    }
  },

  clearDraft() {
    this.setData({
      announcement: ""
    });
  }
});
