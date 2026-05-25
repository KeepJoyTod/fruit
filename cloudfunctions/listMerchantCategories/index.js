const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const shops = db.collection("shops");
const categories = db.collection("categories");

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
  const shopId = String((event && event.shopId) || "").trim();

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

  try {
    await assertCanManageShop(openid, shopId);

    const result = await categories
      .where({ shopId })
      .orderBy("sort", "asc")
      .get();

    const list = (result.data || []).map((category) => ({
      _id: category._id,
      shopId: category.shopId || "",
      name: category.name || "",
      subTitle: category.subTitle || "",
      description: category.description || "",
      sort: Number(category.sort || 0),
      createTime: category.createTime,
      updateTime: category.updateTime
    }));

    list.sort((left, right) => {
      const leftSort = Number(left.sort || 0);
      const rightSort = Number(right.sort || 0);

      if (leftSort !== rightSort) {
        return leftSort - rightSort;
      }

      const leftTime = left.createTime ? new Date(left.createTime).getTime() : 0;
      const rightTime = right.createTime ? new Date(right.createTime).getTime() : 0;
      return rightTime - leftTime;
    });

    return {
      success: true,
      categories: list
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to load categories"
    };
  }
};
