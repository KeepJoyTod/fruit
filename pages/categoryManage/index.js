Page({
  data: {
    categories: [],
    form: {
      name: "",
      subTitle: "",
      description: ""
    }
  },

  onNameInput(event) {
    this.setData({
      "form.name": event.detail.value
    });
  },

  onSubTitleInput(event) {
    this.setData({
      "form.subTitle": event.detail.value
    });
  },

  onDescriptionInput(event) {
    this.setData({
      "form.description": event.detail.value
    });
  },

  submit() {
    wx.showToast({
      title: "待接入分类保存",
      icon: "none"
    });
  }
});
