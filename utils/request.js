const ui = require("./ui");

function getErrorMessage(data, fallbackMessage) {
  if (data && data.message) {
    return data.message;
  }

  return fallbackMessage || "请求失败";
}

function createCloudError(data, fallbackMessage) {
  const error = new Error(getErrorMessage(data, fallbackMessage));
  error.code = data && data.code ? data.code : "";
  error.data = data || {};
  return error;
}

async function callCloud(name, data, options) {
  const requestOptions = options || {};

  if (requestOptions.loadingTitle) {
    ui.showLoading(requestOptions.loadingTitle);
  }

  try {
    const response = await wx.cloud.callFunction({
      name,
      data: data || {}
    });
    const result = response.result || {};

    if (!result.success) {
<<<<<<< HEAD
=======
      throw new Error(getErrorMessage(result, requestOptions.errorMessage));
>>>>>>> 40e955f30f3585c9d5df7555d8f7c1251788b927
      throw createCloudError(result, requestOptions.errorMessage);
    }

    return result;
  } finally {
    if (requestOptions.loadingTitle) {
      ui.hideLoading();
    }
  }
}

module.exports = {
  callCloud
};
