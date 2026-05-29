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
      price: normalizePrice(spec.price),
      stock: String(spec.stock == null ? "" : spec.stock).trim()
    }))
    .filter((spec) => spec.name && spec.price);
}

function normalizePrice(value) {
  return String(value == null ? "" : value).trim();
}

function normalizeStock(value) {
  return String(value == null ? "" : value).trim();
}

function buildSkuText(specGroups, specValueIds) {
  const valueMap = {};
  (specGroups || []).forEach((group) => {
    (group.values || []).forEach((value) => {
      valueMap[value.id] = value.name;
    });
  });

  return (specValueIds || []).map((id) => valueMap[id]).filter(Boolean).join(" / ");
}

function normalizeSpecGroups(specGroups) {
  if (!Array.isArray(specGroups)) {
    return [];
  }

  return specGroups
    .map((group, groupIndex) => {
      const groupId = String(group && group.id ? group.id : `group_${groupIndex + 1}`);
      const values = Array.isArray(group && group.values) ? group.values : [];

      return {
        id: groupId,
        name: String((group && group.name) || "").trim(),
        values: values
          .map((value, valueIndex) => ({
            id: String(value && value.id ? value.id : `${groupId}_value_${valueIndex + 1}`),
            name: String((value && value.name) || "").trim()
          }))
          .filter((value) => value.name)
      };
    })
    .filter((group) => group.name && group.values.length > 0);
}

function normalizeSkus(skus, specGroups) {
  const validValueIds = {};
  specGroups.forEach((group) => {
    group.values.forEach((value) => {
      validValueIds[value.id] = true;
    });
  });

  if (!Array.isArray(skus)) {
    return [];
  }

  return skus
    .map((sku, index) => {
      const specValueIds = (Array.isArray(sku && sku.specValueIds) ? sku.specValueIds : [])
        .map((id) => String(id || ""))
        .filter((id) => validValueIds[id]);

      return {
        id: String((sku && sku.id) || `sku_${index + 1}`),
        specValueIds,
        specText: buildSkuText(specGroups, specValueIds),
        price: normalizePrice(sku && sku.price),
        stock: normalizeStock(sku && sku.stock),
        image: String((sku && sku.image) || "").trim(),
        skuCode: String((sku && sku.skuCode) || "").trim()
      };
    })
    .filter((sku) => sku.specValueIds.length === specGroups.length && sku.price);
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
  const specGroups = normalizeSpecGroups(payload.specGroups);
  const skus = normalizeSkus(payload.skus, specGroups);
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

  if (specGroups.length === 0 || skus.length === 0) {
    return {
      success: false,
      message: "请至少填写一个有效SKU"
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
        specGroups,
        skus,
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
