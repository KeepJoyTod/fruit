function getFileExt(filePath) {
  const extMatch = String(filePath || "").match(/\.[^.]+$/);
  return extMatch ? extMatch[0] : ".jpg";
}

function createCloudPath(options) {
  const uploadOptions = options || {};
  const root = uploadOptions.root || "uploads";
  const ownerId = uploadOptions.ownerId || "unknown";
  const folder = uploadOptions.folder || "default";
  const ext = uploadOptions.ext || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;

  return `${root}/${ownerId}/${folder}/${filename}`;
}

async function chooseImages(options) {
  const chooseOptions = options || {};
  const result = await wx.chooseMedia({
    count: chooseOptions.count || 1,
    mediaType: ["image"],
    sourceType: chooseOptions.sourceType || ["album", "camera"],
    sizeType: chooseOptions.sizeType || ["compressed"]
  });

  return (result.tempFiles || []).map((file) => file.tempFilePath).filter(Boolean);
}

async function uploadImage(filePath, options) {
  const uploadOptions = options || {};
  const cloudPath = createCloudPath(Object.assign({}, uploadOptions, {
    ext: getFileExt(filePath)
  }));
  const result = await wx.cloud.uploadFile({
    cloudPath,
    filePath
  });

  return result.fileID;
}

async function uploadImages(filePaths, options) {
  const uploaded = [];
  const paths = Array.isArray(filePaths) ? filePaths : [];

  for (const path of paths) {
    uploaded.push(await uploadImage(path, options));
  }

  return uploaded;
}

function isChooseCancel(error) {
  return Boolean(error && error.errMsg && error.errMsg.includes("cancel"));
}

module.exports = {
  chooseImages,
  uploadImage,
  uploadImages,
  isChooseCancel
};
