const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");
const categories = db.collection("categories");

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeSort(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function assertCanManageShop(openid, shopId) {
  const shopResult = await shops.doc(shopId).get();
  const shop = shopResult.data;

  if (!shop || !Array.isArray(shop.ownerIds) || !shop.ownerIds.includes(openid)) {
    throw new Error("No permission to manage this shop");
  }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const now = db.serverDate();
  const payload = event || {};

  const categoryId = normalizeString(payload.categoryId);
  const shopId = normalizeString(payload.shopId);
  const name = normalizeString(payload.name);
  const subTitle = normalizeString(payload.subTitle);
  const description = normalizeString(payload.description);
  const sort = normalizeSort(payload.sort);

  if (!openid) {
    return {
      success: false,
      message: "Missing user identity"
    };
  }

  if (!shopId) {
    return {
      success: false,
      message: "Missing shop id"
    };
  }

  if (!name) {
    return {
      success: false,
      message: "Category name is required"
    };
  }

  try {
    await assertCanManageShop(openid, shopId);

    if (categoryId) {
      const categoryResult = await categories.doc(categoryId).get();
      const category = categoryResult.data;

      if (!category || category.shopId !== shopId) {
        throw new Error("Category not found");
      }

      await categories.doc(categoryId).update({
        data: {
          name,
          subTitle,
          description,
          sort,
          updateTime: now
        }
      });

      return {
        success: true,
        categoryId
      };
    }

    const result = await categories.add({
      data: {
        shopId,
        name,
        subTitle,
        description,
        sort,
        createTime: now,
        updateTime: now
      }
    });

    return {
      success: true,
      categoryId: result._id
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to save category"
    };
  }
};
