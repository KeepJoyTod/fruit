const ui = require("./ui");

function getErrorMessage(data, fallbackMessage) {
  if (data && data.message) {
    return data.message;
  }

  return fallbackMessage || "请求失败";
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
      throw new Error(getErrorMessage(result, requestOptions.errorMessage));
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
