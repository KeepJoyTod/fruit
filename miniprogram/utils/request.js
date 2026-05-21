const app = getApp();

function login() {
  if (app.globalData.token) {
    return Promise.resolve(app.globalData.token);
  }
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        if (!loginRes.code) {
          reject(new Error('微信登录失败'));
          return;
        }
        wx.request({
          url: `${app.globalData.apiBaseUrl}/auth/login`,
          method: 'POST',
          data: { code: loginRes.code },
          header: {
            'Content-Type': 'application/json'
          },
          success(res) {
            const body = res.data || {};
            if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0 && body.data && body.data.token) {
              app.globalData.token = body.data.token;
              resolve(body.data.token);
              return;
            }
            reject(new Error(body.message || '微信登录失败'));
          },
          fail: reject
        });
      },
      fail: reject
    });
  });
}

function request(options) {
  const url = `${app.globalData.apiBaseUrl}${options.url}`;
  return login().then((token) => new Promise((resolve, reject) => {
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.header || {})
      },
      success(res) {
        if (res.statusCode === 401) {
          app.globalData.token = '';
        }
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) {
          resolve(body.data);
          return;
        }
        const message = body.message || '请求失败';
        wx.showToast({ title: message, icon: 'none' });
        reject(new Error(message));
      },
      fail(error) {
        wx.showToast({ title: '网络连接失败', icon: 'none' });
        reject(error);
      }
    });
  }));
}

function uploadImage(filePath) {
  const url = `${app.globalData.apiBaseUrl}/files/images`;
  return login().then((token) => new Promise((resolve, reject) => {
    wx.uploadFile({
      url,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${token}`
      },
      success(res) {
        if (res.statusCode === 401) {
          app.globalData.token = '';
        }
        let body = {};
        try {
          body = JSON.parse(res.data || '{}');
        } catch (error) {
          reject(error);
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) {
          resolve(body.data);
          return;
        }
        const message = body.message || '上传失败';
        wx.showToast({ title: message, icon: 'none' });
        reject(new Error(message));
      },
      fail(error) {
        wx.showToast({ title: '上传失败', icon: 'none' });
        reject(error);
      }
    });
  }));
}

module.exports = {
  login,
  request,
  uploadImage
};
