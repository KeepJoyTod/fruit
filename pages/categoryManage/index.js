const categoryService = require("../../services/categoryService");
const {
  loadMerchantCategories,
  clearMerchantCategoryCache,
  clearPublicCategoryCache
} = require("../../utils/category");
const store = require("../../utils/store");
const authRequired = require("../../behaviors/authRequired");
const navigation = require("../../utils/navigation");
const ui = require("../../utils/ui");
const {
  createEmptyCategoryForm,
  createCategoryForm,
  validateCategoryForm,
  buildCategoryPayload
} = require("../../forms/categoryForm");

function clearCategoryCaches() {
  clearMerchantCategoryCache(store.getShopId());
  clearPublicCategoryCache();
}

Page({
  behaviors: [authRequired],

  data: {
    loading: false,
    saving: false,
    editing: false,
    categories: [],
    form: createEmptyCategoryForm()
  },

  onShow() {
    this.loadCategories();
  },

  async loadCategories() {
    if (!this.requireShopLogin()) {
      return;
    }

    this.setData({ loading: true });

    try {
      const categories = await loadMerchantCategories(store.getShopId());
      this.setData({ categories });
    } catch (error) {
      console.error("load merchant categories failed", error);
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      ui.showError(error, "分类加载失败");
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
      form: createCategoryForm(category)
    });
  },

  cancelEdit() {
    this.setData({
      editing: false,
      form: createEmptyCategoryForm()
    });
  },

  validateForm() {
    return validateCategoryForm(this.data.form, store.getShopId());
  },

  async submit() {
    if (this.data.saving) {
      return;
    }

    const errorMessage = this.validateForm();
    if (errorMessage) {
      ui.showToast(errorMessage);
      return;
    }

    this.setData({ saving: true });
    ui.showLoading("保存中");

    try {
      await categoryService.saveCategory(buildCategoryPayload(this.data.form, store.getShopId()));

      ui.showSuccess("已保存");
      clearCategoryCaches();
      this.setData({
        editing: false,
        form: createEmptyCategoryForm()
      });
      store.markHomeFruitsChanged();
      navigation.redirectToMerchantHome();
    } catch (error) {
      console.error("save category failed", error);
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      ui.showError(error, "分类保存失败");
    } finally {
      ui.hideLoading();
      this.setData({ saving: false });
    }
  },

  confirmDelete(event) {
    const { id, name } = event.currentTarget.dataset;

    wx.showModal({
      title: "删除分类",
      content: `确认删除"${name}"吗？商品会自动移除此分类。`,
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
    ui.showLoading("删除中");

    try {
      await categoryService.deleteCategory(categoryId);

      ui.showSuccess("已删除");

      if (this.data.form.categoryId === categoryId) {
        this.cancelEdit();
      }

      clearCategoryCaches();
      store.markHomeFruitsChanged();
      navigation.redirectToMerchantHome();
    } catch (error) {
      console.error("delete category failed", error);
      if (this.handleShopAccessDenied(error)) {
        return;
      }

      ui.showError(error, "分类删除失败");
    } finally {
      ui.hideLoading();
    }
  }
});
