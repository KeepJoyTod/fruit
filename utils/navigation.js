function redirectTo(url) {
  wx.redirectTo({
    url,
    fail: () => {
      wx.reLaunch({
        url
      });
    }
  });
}

function navigateTo(url) {
  wx.navigateTo({
    url
  });
}

function redirectToLogin() {
  redirectTo("/pages/login/index");
}

function redirectToMerchantHome() {
  redirectTo("/pages/merchant/index");
}

function navigateToSearch() {
  navigateTo("/pages/search/index");
}

function navigateToLogin() {
  navigateTo("/pages/login/index");
}

function navigateToCategory(categoryId) {
  navigateTo(`/pages/category/index?id=${categoryId}`);
}

function navigateToFruitDetail(fruitId) {
  navigateTo(`/pages/detail/index?id=${fruitId}`);
}

function navigateToPublish() {
  navigateTo("/pages/publish/index");
}

function navigateToEditFruit(fruitId) {
  navigateTo(`/pages/edit/index?id=${fruitId}`);
}

function navigateToCategoryManage() {
  navigateTo("/pages/categoryManage/index");
}

function navigateToShopSettings() {
  navigateTo("/pages/shopSettings/index");
}

function navigateToAnnouncementManage() {
  navigateTo("/pages/announcementManage/index");
}

function navigateToOwnerManage() {
  navigateTo("/pages/ownerManage/index");
}

module.exports = {
  redirectTo,
  navigateTo,
  redirectToLogin,
  redirectToMerchantHome,
  navigateToSearch,
  navigateToLogin,
  navigateToCategory,
  navigateToFruitDetail,
  navigateToPublish,
  navigateToEditFruit,
  navigateToCategoryManage,
  navigateToShopSettings,
  navigateToAnnouncementManage,
  navigateToOwnerManage
};
