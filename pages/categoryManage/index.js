const app = getApp();

function createEmptyForm() {
  return {
    categoryId: "",
    name: "",
    subTitle: "",
    description: "",
    sort: ""
  };
}

Page({
  data: {
    loading: false,
    saving: false,
    editing: false,
    categories: [],
    form: createEmptyForm()
  },

  onShow() {
    this.loadCategories();
  },

  async loadCategories() {
    const shop = app.globalData.shop;

    if (!shop || !shop._id) {
      wx.showToast({
        title: "请先登录",
        icon: "none"
      });
      wx.redirectTo({
        url: "/pages/login/index"
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: "listMerchantCategories",
        data: {
          shopId: shop._id
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "分类加载失败");
      }

      const categories = data.categories || [];
      app.globalData.categories = categories;
      app.globalData.categoryMap = categories.reduce((map, item) => {
        if (item && item._id) {
          map[item._id] = item;
        }
        return map;
      }, {});

      this.setData({ categories });
    } catch (error) {
      console.error("load merchant categories failed", error);
      wx.showToast({
        title: error.message || "分类加载失败",
        icon: "none"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onNameInput(event) {
    this.setData({
      "form.name": event.detail.value
    });
  },

  onSubTitleInput(event) {
    this.setData({
      "form.subTitle": event.detail.value
    });
  },

  onDescriptionInput(event) {
    this.setData({
      "form.description": event.detail.value
    });
  },

  onSortInput(event) {
    this.setData({
      "form.sort": event.detail.value
    });
  },

  editCategory(event) {
    const { id } = event.currentTarget.dataset;
    const category = this.data.categories.find((item) => item._id === id);

    if (!category) {
      return;
    }

    this.setData({
      editing: true,
      form: {
        categoryId: category._id,
        name: category.name || "",
        subTitle: category.subTitle || "",
        description: category.description || "",
        sort: typeof category.sort === "number" ? String(category.sort) : ""
      }
    });
  },

  cancelEdit() {
    this.setData({
      editing: false,
      form: createEmptyForm()
    });
  },

  validateForm() {
    if (!this.data.form.name.trim()) {
      return "请填写分类名称";
    }

    if (!app.globalData.shop || !app.globalData.shop._id) {
      return "请先完成商家登录";
    }

    return "";
  },

  async submit() {
    if (this.data.saving) {
      return;
    }

    const errorMessage = this.validateForm();
    if (errorMessage) {
      wx.showToast({
        title: errorMessage,
        icon: "none"
      });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({
      title: "保存中"
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "saveCategory",
        data: {
          categoryId: this.data.form.categoryId,
          shopId: app.globalData.shop._id,
          name: this.data.form.name,
          subTitle: this.data.form.subTitle,
          description: this.data.form.description,
          sort: this.data.form.sort
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "分类保存失败");
      }

      wx.showToast({
        title: "已保存",
        icon: "success"
      });

      this.setData({
        editing: false,
        form: createEmptyForm()
      });
      await this.loadCategories();
    } catch (error) {
      console.error("save category failed", error);
      wx.showToast({
        title: error.message || "分类保存失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({ saving: false });
    }
  },

  confirmDelete(event) {
    const { id, name } = event.currentTarget.dataset;

    wx.showModal({
      title: "删除分类",
      content: `确认删除“${name}”吗？商品会自动移除此分类。`,
      confirmText: "删除",
      confirmColor: "#b91c1c",
      success: (result) => {
        if (result.confirm) {
          this.deleteCategory(id);
        }
      }
    });
  },

  async deleteCategory(categoryId) {
    wx.showLoading({
      title: "删除中"
    });

    try {
      const result = await wx.cloud.callFunction({
        name: "deleteCategory",
        data: {
          categoryId
        }
      });
      const data = result.result;

      if (!data || !data.success) {
        throw new Error((data && data.message) || "分类删除失败");
      }

      wx.showToast({
        title: "已删除",
        icon: "success"
      });

      if (this.data.form.categoryId === categoryId) {
        this.cancelEdit();
      }

      await this.loadCategories();
    } catch (error) {
      console.error("delete category failed", error);
      wx.showToast({
        title: error.message || "分类删除失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
    }
  }
});
