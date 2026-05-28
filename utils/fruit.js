function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePrice(value) {
  const price = Number(value || 0);
  return Number.isFinite(price) ? price : 0;
}

function normalizeStock(value) {
  return String(value == null ? "" : value).trim();
}

function getStockNumber(value) {
  const text = normalizeStock(value);

  if (!/^\d+$/.test(text)) {
    return null;
  }

  return Number.parseInt(text, 10);
}

function getStockState(value) {
  const text = normalizeStock(value);
  const stockNumber = getStockNumber(text);

  if (stockNumber !== null) {
    return {
      text: String(stockNumber),
      number: stockNumber,
      isAvailable: stockNumber > 0,
      isLowStock: stockNumber > 0 && stockNumber <= 5
    };
  }

  if (!text) {
    return {
      text: "0",
      number: 0,
      isAvailable: false,
      isLowStock: false
    };
  }

  if (["售罄", "缺货", "无货", "0"].indexOf(text) >= 0) {
    return {
      text,
      number: 0,
      isAvailable: false,
      isLowStock: false
    };
  }

  return {
    text,
    number: null,
    isAvailable: true,
    isLowStock: ["少量", "库存少", "紧张", "即将售罄"].indexOf(text) >= 0
  };
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

function getSkuKey(specValueIds) {
  return (specValueIds || []).join("|");
}

function getSkuCombinations(specGroups) {
  const groups = (specGroups || [])
    .map((group) => ({
      ...group,
      values: (group.values || []).filter((value) => value && value.name)
    }))
    .filter((group) => group.name && group.values.length > 0);

  if (groups.length === 0) {
    return [];
  }

  return groups.reduce(
    (rows, group) => {
      const nextRows = [];
      rows.forEach((row) => {
        group.values.forEach((value) => {
          nextRows.push(row.concat(value.id));
        });
      });
      return nextRows;
    },
    [[]]
  );
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
  const groups = normalizeSpecGroups(specGroups);
  const validValueIds = {};
  groups.forEach((group) => {
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
      const id = String((sku && sku.id) || `sku_${index + 1}`);

      return {
        id,
        specValueIds,
        specText: buildSkuText(groups, specValueIds),
        price: normalizePrice(sku && sku.price),
        stock: normalizeStock(sku && sku.stock),
        image: String((sku && sku.image) || "").trim(),
        skuCode: String((sku && sku.skuCode) || "").trim()
      };
    })
    .filter((sku) => sku.specValueIds.length === groups.length && sku.price > 0);
}

function buildSkusFromGroups(specGroups, currentSkus) {
  const groups = normalizeSpecGroups(specGroups);
  const currentMap = {};
  (currentSkus || []).forEach((sku) => {
    currentMap[getSkuKey(sku.specValueIds)] = sku;
  });

  return getSkuCombinations(groups).map((specValueIds) => {
    const key = getSkuKey(specValueIds);
    const currentSku = currentMap[key] || {};

    return {
      id: currentSku.id || createId("sku"),
      specValueIds,
      specText: buildSkuText(groups, specValueIds),
      price: currentSku.price || "",
      stock: currentSku.stock || "",
      image: currentSku.image || "",
      skuCode: currentSku.skuCode || ""
    };
  });
}

function convertSpecsToSkuData(specs) {
  const legacySpecs = Array.isArray(specs) ? specs : [];
  const groups = [
    {
      id: "legacy_name",
      name: "规格",
      values: []
    },
    {
      id: "legacy_weight",
      name: "重量",
      values: []
    }
  ];
  const nameValueMap = {};
  const weightValueMap = {};
  const skus = [];

  legacySpecs.forEach((spec, index) => {
    const specName = String((spec && spec.name) || "").trim();
    const weight = String((spec && spec.weight) || "").trim() || "默认";

    if (!specName) {
      return;
    }

    if (!nameValueMap[specName]) {
      nameValueMap[specName] = `legacy_name_${groups[0].values.length + 1}`;
      groups[0].values.push({
        id: nameValueMap[specName],
        name: specName
      });
    }

    if (!weightValueMap[weight]) {
      weightValueMap[weight] = `legacy_weight_${groups[1].values.length + 1}`;
      groups[1].values.push({
        id: weightValueMap[weight],
        name: weight
      });
    }

    const specValueIds = [nameValueMap[specName], weightValueMap[weight]];
    skus.push({
      id: `legacy_sku_${index + 1}`,
      specValueIds,
      specText: buildSkuText(groups, specValueIds),
      price: spec.price,
      stock: spec.stock,
      image: "",
      skuCode: ""
    });
  });

  return {
    specGroups: groups.filter((group) => group.values.length > 0),
    skus
  };
}

function normalizeSkuData(fruit) {
  const specGroups = normalizeSpecGroups(fruit && fruit.specGroups);
  const skus = normalizeSkus(fruit && fruit.skus, specGroups);

  if (specGroups.length > 0 && skus.length > 0) {
    return {
      specGroups,
      skus
    };
  }

  return convertSpecsToSkuData(fruit && fruit.specs);
}

function getMinSkuPrice(skus) {
  if (!Array.isArray(skus) || skus.length === 0) {
    return 0;
  }

  return skus.reduce((min, sku) => {
    const price = normalizePrice(sku && sku.price);
    return min === 0 || (price > 0 && price < min) ? price : min;
  }, 0);
}

function getMinPrice(specs) {
  return getMinSkuPrice(specs);
}

function getTotalSkuStock(skus) {
  return (skus || []).reduce((sum, sku) => {
    const stockNumber = getStockNumber(sku && sku.stock);
    return sum + (stockNumber === null ? 0 : stockNumber);
  }, 0);
}

function getSkuStockSummary(skus) {
  const totalStock = getTotalSkuStock(skus);
  const labels = [];

  (skus || []).forEach((sku) => {
    const state = getStockState(sku && sku.stock);
    if (state.number === null && labels.indexOf(state.text) < 0) {
      labels.push(state.text);
    }
  });

  if (totalStock > 0 && labels.length > 0) {
    return `${totalStock} + ${labels.join("/")}`;
  }

  if (totalStock > 0) {
    return String(totalStock);
  }

  return labels.length > 0 ? labels.join("/") : "0";
}

function hasLowSkuStock(skus) {
  return (skus || []).some((sku) => getStockState(sku && sku.stock).isLowStock);
}

function formatPrice(price) {
  return Number(price || 0).toFixed(2);
}

function normalizeImageList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((item) => String(item || "").trim()).filter(Boolean);
}

function pickFruitMainImage(fruit) {
  const mainImage = String((fruit && fruit.mainImage) || "").trim();

  if (mainImage) {
    return mainImage;
  }

  return normalizeImageList(fruit && fruit.detailImages)[0] || "";
}

function buildFruitGallery(fruit) {
  const seen = {};
  return [pickFruitMainImage(fruit)]
    .concat(normalizeImageList(fruit && fruit.detailImages))
    .filter((url) => {
      if (!url || seen[url]) {
        return false;
      }

      seen[url] = true;
      return true;
    });
}

module.exports = {
  createId,
  normalizeSpecGroups,
  normalizeSkus,
  buildSkusFromGroups,
  buildSkuText,
  getSkuKey,
  normalizeSkuData,
  getMinSkuPrice,
  getMinPrice,
  getTotalSkuStock,
  getSkuStockSummary,
  getStockState,
  hasLowSkuStock,
  formatPrice,
  normalizeImageList,
  pickFruitMainImage,
  buildFruitGallery
};
