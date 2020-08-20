const app = getApp();

Page({
  data: {
    password: '',
    confirmPassword: '',
  },
  onLoad() {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
  },
  // 获取密码
  getPassword(e) {
    this.setData({
      password: e.detail.value,
    });
  },
  // 获取二次密码
  getconfirmPassword(e) {
    this.setData({
      confirmPassword: e.detail.value,
    });
  },
  validateFrom() {
    let reg = /^\d{6}$/;
    if (this.data.password.trim() === '') {
      wx.showToast({
        icon: 'none',
        title: '新密码不能为空',
        duration: 1000,
      });
      return false;
    }
    if (!reg.test(this.data.password.trim())) {
      wx.showToast({
        icon: 'none',
        title: '密码是数字且是6位',
        duration: 1000,
      });
      return false;
    }
    if (this.data.confirmPassword.trim() === '') {
      wx.showToast({
        icon: 'none',
        title: '确认密码不能为空',
        duration: 1000,
      });
      return false;
    }
    if (!reg.test(this.data.confirmPassword.trim())) {
      wx.showToast({
        icon: 'none',
        title: '密码是数字且是6位',
        duration: 1000,
      });
      return false;
    }
    if (this.data.confirmPassword.trim() !== this.data.password.trim()) {
      wx.showToast({
        icon: 'none',
        title: '两次密码不一致',
        duration: 1000,
      });
      return false;
    }
    return true;
  },
  //重置淋浴密码
  async changePwd() {
    if (this.validateFrom()) {
      app.$post('shower/password/resetShowerPassword', this.data).then(e => {
        wx.showToast({
          title: '重置密码成功',
          icon: 'success',
        });
        wx.navigateBack({
          delta: 1,
        });
      });
    }
  },
});