const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const shops = db.collection("shops");
const categories = db.collection("categories");
const fruits = db.collection("fruits");

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
  const categoryId = String((event && event.categoryId) || "").trim();

  if (!openid) {
    return {
      success: false,
      message: "Missing user identity"
    };
  }

  if (!categoryId) {
    return {
      success: false,
      message: "Missing category id"
    };
  }

  try {
    const categoryResult = await categories.doc(categoryId).get();
    const category = categoryResult.data;

    if (!category) {
      throw new Error("Category not found");
    }

    await assertCanManageShop(openid, category.shopId);
    await categories.doc(categoryId).remove();

    const relatedFruits = await fruits
      .where({
        shopId: category.shopId,
        categoryIds: categoryId
      })
      .field({
        categoryIds: true
      })
      .get();

    await Promise.all((relatedFruits.data || []).map((fruit) => (
      fruits.doc(fruit._id).update({
        data: {
          categoryIds: _.pull(categoryId),
          updateTime: db.serverDate()
        }
      })
    )));

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to delete category"
    };
  }
};
