const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const categories = db.collection("categories");

exports.main = async () => {
  try {
    const result = await categories.orderBy("sort", "asc").get();
    const list = (result.data || []).map((category) => ({
      _id: category._id,
      shopId: category.shopId || "",
      name: category.name || "",
      subTitle: category.subTitle || "",
      description: category.description || "",
      sort: Number(category.sort || 0),
      createTime: category.createTime
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
      message: error.message || "分类加载失败"
    };
  }
};
