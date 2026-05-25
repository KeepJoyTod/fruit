const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");
const fruits = db.collection("fruits");

function normalizeSpecs(specs) {
  if (!Array.isArray(specs)) {
    return [];
  }

  return specs
    .map((spec) => ({
      name: String(spec.name || "").trim(),
      weight: String(spec.weight || "").trim(),
      price: Number(spec.price || 0),
      stock: Number(spec.stock || 0)
    }))
    .filter((spec) => spec.name && spec.price > 0);
}

function normalizeStringList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizeImageList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 9);
}

function normalizeStatus(value) {
  return value === "off_sale" ? "off_sale" : "on_sale";
}

async function assertCanManageShop(openid, shopId) {
  const shopResult = await shops.doc(shopId).get();
  const shop = shopResult.data;

  if (!shop || !Array.isArray(shop.ownerIds) || !shop.ownerIds.includes(openid)) {
    throw new Error("无权管理该店铺");
  }

  return shop;
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const now = db.serverDate();
  const payload = event || {};

  const shopId = String(payload.shopId || "").trim();
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  const origin = String(payload.origin || "").trim();
  const mainImage = String(payload.mainImage || "").trim();
  const detailImages = normalizeImageList(payload.detailImages);
  const categoryIds = normalizeStringList(payload.categoryIds);
  const tags = normalizeStringList(payload.tags);
  const specs = normalizeSpecs(payload.specs);
  const status = normalizeStatus(payload.status);

  if (!openid) {
    return {
      success: false,
      message: "无法获取微信用户身份"
    };
  }

  if (!shopId) {
    return {
      success: false,
      message: "缺少店铺信息"
    };
  }

  if (!name) {
    return {
      success: false,
      message: "请填写商品名称"
    };
  }

  if (specs.length === 0) {
    return {
      success: false,
      message: "请至少填写一个有效规格"
    };
  }

  try {
    await assertCanManageShop(openid, shopId);

    const result = await fruits.add({
      data: {
        shopId,
        creatorId: openid,
        name,
        categoryIds,
        tags,
        mainImage,
        detailImages,
        description,
        origin,
        specs,
        status,
        createTime: now,
        updateTime: now
      }
    });

    return {
      success: true,
      fruitId: result._id
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "保存商品失败"
    };
  }
};
