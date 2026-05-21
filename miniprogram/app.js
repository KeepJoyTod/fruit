App({
  onLaunch() {
    const token = wx.getStorageSync('token') || '';
    this.globalData.token = token;
  },

  globalData: {
    apiBaseUrl: 'http://localhost:8080/api',
    token: ''
  }
});
