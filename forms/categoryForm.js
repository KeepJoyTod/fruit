function createEmptyCategoryForm() {
  return {
    categoryId: "",
    name: "",
    subTitle: "",
    description: "",
    sort: ""
  };
}

function createCategoryForm(category) {
  if (!category) {
    return createEmptyCategoryForm();
  }

  return {
    categoryId: category._id,
    name: category.name || "",
    subTitle: category.subTitle || "",
    description: category.description || "",
    sort: typeof category.sort === "number" ? String(category.sort) : ""
  };
}

function validateCategoryForm(form, shopId) {
  if (!String((form && form.name) || "").trim()) {
    return "请填写分类名称";
  }

  if (!shopId) {
    return "请先完成商家登录";
  }

  return "";
}

function buildCategoryPayload(form, shopId) {
  return {
    categoryId: form.categoryId,
    shopId,
    name: form.name,
    subTitle: form.subTitle,
    description: form.description,
    sort: form.sort
  };
}

module.exports = {
  createEmptyCategoryForm,
  createCategoryForm,
  validateCategoryForm,
  buildCategoryPayload
};
