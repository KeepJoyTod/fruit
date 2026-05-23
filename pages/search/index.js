Page({
  data: {
    keyword: "",
    results: [],
    loading: false,
    hasSearched: false
  },

  onLoad() {
    this.searchTimer = null;
    this.searchRequestId = 0;
  },

  onUnload() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  },

  onKeywordInput(event) {
    const keyword = event.detail.value;

    this.setData({
      keyword
    });

    this.scheduleSearch(keyword);
  },

  onKeywordConfirm() {
    this.runSearch();
  },

  scheduleSearch(keyword) {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.runSearch(keyword);
    }, 300);
  },

  async runSearch(keyword = this.data.keyword) {
    const normalizedKeyword = String(keyword || "").trim();

    if (!normalizedKeyword) {
      this.setData({
        results: [],
        loading: false,
        hasSearched: false
      });
      return;
    }

    const requestId = ++this.searchRequestId;
    this.setData({
      loading: true,
      hasSearched: true
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "listPublicFruits",
        data: {
          keyword: normalizedKeyword,
          page: 1,
          pageSize: 20
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "搜索失败");
      }

      if (requestId !== this.searchRequestId) {
        return;
      }

      this.setData({
        results: data.fruits || []
      });
    } catch (error) {
      if (requestId !== this.searchRequestId) {
        return;
      }

      console.error("search fruits failed", error);
      wx.showToast({
        title: error.message || "搜索失败",
        icon: "none"
      });
      this.setData({
        results: []
      });
    } finally {
      if (requestId === this.searchRequestId) {
        this.setData({
          loading: false
        });
      }
    }
  },

  clearKeyword() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    this.setData({
      keyword: "",
      results: [],
      loading: false,
      hasSearched: false
    });
  },

  usePresetKeyword(event) {
    const { keyword } = event.currentTarget.dataset;

    if (!keyword) {
      return;
    }

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    this.setData({
      keyword
    });

    this.runSearch(keyword);
  },

  goDetail(event) {
    const { fruit } = event.detail;
    wx.navigateTo({
      url: `/pages/detail/index?id=${fruit._id}`
    });
  }
});
