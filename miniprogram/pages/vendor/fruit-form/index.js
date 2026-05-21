const { request, uploadImage } = require('../../../utils/request');

Page({
  data: {
    fruitId: '',
    isEdit: false,
    submitting: false,
    uploading: false,
    form: {
      name: '',
      price: '',
      unit: '斤',
      tagsText: '新鲜到货',
      imageUrl: '',
      description: ''
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ fruitId: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑水果' });
      this.loadFruit(options.id);
    }
  },

  loadFruit(id) {
    request({ url: `/fruits/${id}` }).then((fruit) => {
      this.setData({
        form: {
          name: fruit.name || '',
          price: String(fruit.price || ''),
          unit: fruit.unit || '斤',
          tagsText: (fruit.tags || []).join(','),
          imageUrl: fruit.images && fruit.images[0] ? fruit.images[0] : '',
          description: fruit.description || ''
        }
      });
    });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const filePath = res.tempFilePaths[0];
        this.setData({ uploading: true });
        uploadImage(filePath)
          .then((data) => {
            this.setData({ 'form.imageUrl': data.url || filePath });
            wx.showToast({ title: '图片已添加' });
          })
          .finally(() => this.setData({ uploading: false }));
      }
    });
  },

  removeImage() {
    this.setData({ 'form.imageUrl': '' });
  },

  validateForm() {
    const form = this.data.form;
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入水果名称', icon: 'none' });
      return false;
    }
    if (!Number(form.price) || Number(form.price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return false;
    }
    if (!form.unit.trim()) {
      wx.showToast({ title: '请输入单位', icon: 'none' });
      return false;
    }
    return true;
  },

  submit() {
    if (!this.validateForm() || this.data.submitting) {
      return;
    }
    const form = this.data.form;
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      unit: form.unit.trim(),
      images: form.imageUrl ? [form.imageUrl] : [],
      tags: form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
      description: form.description.trim()
    };
    this.setData({ submitting: true });
    request({
      url: this.data.isEdit ? `/fruits/${this.data.fruitId}` : '/fruits',
      method: this.data.isEdit ? 'PUT' : 'POST',
      data: payload
    }).then(() => {
      wx.showToast({ title: this.data.isEdit ? '已保存' : '已上架' });
      wx.navigateBack();
    }).finally(() => this.setData({ submitting: false }));
  }
});
