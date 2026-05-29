function getErrorMessage(error) {
  return String((error && error.message) || error || "");
}

function isShopAccessDenied(error) {
  const message = getErrorMessage(error);
  return [
    "No permission to manage this shop",
    "No permission to manage this fruit",
    "没有权限，请先联系店主",
    "无权管理该店铺",
    "无权查看该店铺商品",
    "无权管理该商品",
    "无权删除该商品"
  ].some((keyword) => message.includes(keyword));
}

module.exports = {
  isShopAccessDenied
};
