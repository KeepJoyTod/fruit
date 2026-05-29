const { callCloud } = require("../utils/request");
const API = require("../constants/api");

function publishAnnouncement(shopId, announcement) {
  return callCloud(API.PUBLISH_ANNOUNCEMENT, {
    shopId,
    announcement
  });
}

module.exports = {
  publishAnnouncement
};
