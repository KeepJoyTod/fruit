const tcb = require("@cloudbase/node-sdk");

const app = tcb.init({
  env: tcb.SYMBOL_DEFAULT_ENV
});

const db = app.database();

const COLLECTION_NAMES = ["users", "shops", "categories", "fruits"];

function isCollectionExistsError(error) {
  const message = String((error && error.message) || "");
  const code = String((error && error.code) || "");
  return /exist/i.test(message) || /exist/i.test(code);
}

async function ensureCollection(name) {
  if (typeof db.createCollectionIfNotExists === "function") {
    await db.createCollectionIfNotExists(name);
    return {
      name,
      created: true
    };
  }

  try {
    await db.createCollection(name);
    return {
      name,
      created: true
    };
  } catch (error) {
    if (isCollectionExistsError(error)) {
      return {
        name,
        created: false
      };
    }

    throw error;
  }
}

async function findOne(collectionName, condition) {
  const result = await db.collection(collectionName).where(condition).limit(1).get();
  return (result.data && result.data[0]) || null;
}

async function ensureDocument(collectionName, condition, dataFactory) {
  const existing = await findOne(collectionName, condition);

  if (existing) {
    return {
      created: false,
      document: existing
    };
  }

  const data = typeof dataFactory === "function" ? dataFactory() : dataFactory;
  const addResult = await db.collection(collectionName).add({
    ...data
  });
  const document = await db.collection(collectionName).doc(addResult.id || addResult._id).get();

  return {
    created: true,
    document: document.data
  };
}

exports.main = async () => {
  const now = new Date();
  const createdCollections = [];

  try {
    for (const name of COLLECTION_NAMES) {
      const result = await ensureCollection(name);

      if (result.created) {
        createdCollections.push(name);
      }
    }

    const shopResult = await ensureDocument("shops", {
      creatorId: "system-init",
      name: "水果小店示例"
    }, () => ({
      name: "水果小店示例",
      logo: "",
      creatorId: "system-init",
      ownerIds: ["system-init"],
      createTime: now,
      updateTime: now
    }));
    const shop = shopResult.document;

    const categorySeeds = [
      {
        name: "热门推荐",
        subTitle: "今日鲜果",
        description: "初始化生成的首页分类示例",
        sort: 1
      },
      {
        name: "当季特选",
        subTitle: "应季直发",
        description: "初始化生成的应季分类示例",
        sort: 2
      }
    ];

    const categoryResults = [];

    for (const seed of categorySeeds) {
      const result = await ensureDocument("categories", {
        shopId: shop._id,
        name: seed.name
      }, () => ({
        shopId: shop._id,
        name: seed.name,
        subTitle: seed.subTitle,
        description: seed.description,
        sort: seed.sort,
        createTime: now
      }));

      categoryResults.push(result);
    }

    const categoryMap = categoryResults.reduce((map, item) => {
      map[item.document.name] = item.document;
      return map;
    }, {});

    const fruitSeeds = [
      {
        name: "广西沃柑",
        categoryNames: ["热门推荐"],
        tags: ["热卖", "低价"],
        description: "皮薄多汁，甜度高，适合家庭日常购买。",
        origin: "广西",
        specs: [
          {
            name: "标准装",
            weight: "5斤",
            price: 29.9,
            stock: 99
          }
        ]
      },
      {
        name: "泰国金枕榴莲",
        categoryNames: ["热门推荐", "当季特选"],
        tags: ["新上", "预售"],
        description: "果肉细腻软糯，适合作为详情页演示数据。",
        origin: "泰国",
        specs: [
          {
            name: "大果",
            weight: "2-3斤",
            price: 79.9,
            stock: 20
          },
          {
            name: "特大果",
            weight: "3-4斤",
            price: 99.9,
            stock: 12
          }
        ]
      }
    ];

    const fruitResults = [];

    for (const seed of fruitSeeds) {
      const result = await ensureDocument("fruits", {
        shopId: shop._id,
        name: seed.name
      }, () => ({
        shopId: shop._id,
        creatorId: "system-init",
        name: seed.name,
        categoryIds: seed.categoryNames.map((name) => categoryMap[name] && categoryMap[name]._id).filter(Boolean),
        tags: seed.tags,
        mainImage: "",
        detailImages: [],
        description: seed.description,
        origin: seed.origin,
        specs: seed.specs,
        status: "on_sale",
        createTime: now,
        updateTime: now
      }));

      fruitResults.push(result);
    }

    return {
      success: true,
      message: "数据库初始化完成",
      collections: {
        ensured: COLLECTION_NAMES,
        created: createdCollections
      },
      shop: {
        created: shopResult.created,
        id: shop._id,
        name: shop.name
      },
      categories: categoryResults.map((item) => ({
        created: item.created,
        id: item.document._id,
        name: item.document.name
      })),
      fruits: fruitResults.map((item) => ({
        created: item.created,
        id: item.document._id,
        name: item.document.name
      }))
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "数据库初始化失败"
    };
  }
};
