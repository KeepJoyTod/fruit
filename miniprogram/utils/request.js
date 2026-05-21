const app = getApp();

function saveAuth(data) {
  const token = data.token;
  const user = {
    userId: data.userId,
    username: data.username,
    nickname: data.nickname,
    role: data.role
  };
  app.globalData.token = token;
  app.globalData.user = user;
  wx.setStorageSync('token', token);
  wx.setStorageSync('user', user);
}

function clearToken() {
  app.globalData.token = '';
  app.globalData.user = null;
  wx.removeStorageSync('token');
  wx.removeStorageSync('user');
}

function getStoredToken() {
  if (app.globalData.token) {
    return app.globalData.token;
  }
  const token = wx.getStorageSync('token') || '';
  app.globalData.token = token;
  return token;
}

function login(credentials = {}) {
  const token = getStoredToken();
  if (!credentials.force && token) {
    return Promise.resolve(app.globalData.token);
  }
  if (!credentials.username || !credentials.password) {
    return Promise.reject(new Error('请输入账号和密码'));
  }
  return authRequest('/auth/login', credentials);
}

function register(data) {
  return authRequest('/auth/register', data);
}

function authRequest(path, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBaseUrl}${path}`,
      method: 'POST',
      data,
      header: {
        'Content-Type': 'application/json'
      },
      success(res) {
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0 && body.data && body.data.token) {
          saveAuth(body.data);
          resolve(body.data);
          return;
        }
        reject(new Error(body.message || '登录失败'));
      },
      fail: reject
    });
  });
}

function request(options) {
  const url = `${app.globalData.apiBaseUrl}${options.url}`;
  const showErrorToast = options.showErrorToast !== false;
  const tokenPromise = options.auth === false ? Promise.resolve('') : login();
  return tokenPromise.then((token) => new Promise((resolve, reject) => {
    const header = {
      'Content-Type': 'application/json',
      ...(options.header || {})
    };
    if (token) {
      header.Authorization = `Bearer ${token}`;
    }
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success(res) {
        if (res.statusCode === 401) {
          clearToken();
        }
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) {
          resolve(body.data);
          return;
        }
        const message = body.message || '请求失败';
        const error = new Error(message);
        error.statusCode = res.statusCode;
        error.code = body.code;
        if (showErrorToast) {
          wx.showToast({ title: message, icon: 'none' });
        }
        reject(error);
      },
      fail(error) {
        if (showErrorToast) {
          wx.showToast({ title: '网络连接失败', icon: 'none' });
        }
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
          clearToken();
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
  clearToken,
  login,
  register,
  request,
  uploadImage
};
