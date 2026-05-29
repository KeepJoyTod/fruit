function createShopForm(shop) {
  const source = shop || {};

  return {
    name: source.name || "",
    logo: source.logo || "",
    logoTemp: "",
    contactPhone: source.contactPhone || "",
    address: source.address || "",
    businessStatus: source.businessStatus || "open"
  };
}

function validateShopForm(form, shopId) {
  if (!shopId) {
    return "请先完成商家登录";
  }

  if (!String((form && form.name) || "").trim()) {
    return "请填写店铺名称";
  }

  return "";
}

function buildShopPayload(form, shopId, logo) {
  return {
    shopId,
    name: form.name,
    logo,
    contactPhone: form.contactPhone,
    address: form.address,
    businessStatus: form.businessStatus
  };
}

module.exports = {
  createShopForm,
  validateShopForm,
  buildShopPayload
};
