function showToast(title, icon) {
  wx.showToast({
    title,
    icon: icon || "none"
  });
}

function showSuccess(title) {
  showToast(title, "success");
}

function showError(message, fallbackMessage) {
  showToast((message && message.message) || message || fallbackMessage || "操作失败", "none");
}

function showLoading(title) {
  wx.showLoading({
    title
  });
}

function hideLoading() {
  wx.hideLoading();
}

module.exports = {
  showToast,
  showSuccess,
  showError,
  showLoading,
  hideLoading
};
