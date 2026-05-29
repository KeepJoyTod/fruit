const fruitService = require("../../services/fruitService");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");

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
      const data = await fruitService.listPublicFruits({
        keyword: normalizedKeyword,
        page: 1,
        pageSize: 20
      });

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
      ui.showError(error, "搜索失败");
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
    navigation.navigateToFruitDetail(fruit._id);
  }
});
