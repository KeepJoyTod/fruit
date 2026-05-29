App({
  onLaunch() {
    const token = wx.getStorageSync('token') || '';
    const user = wx.getStorageSync('user') || null;
    this.globalData.token = token;
    this.globalData.user = user;
  },

  globalData: {
    apiBaseUrl: 'http://192.168.112.1:8080/api',
    token: '',
    user: null
  }
});
