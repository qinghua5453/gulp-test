const app = getApp();
Page({
  data: {
    userName: null,
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    if (options.nickName) {
      this.setData({
        userName: options.nickName,
      });
    }
  },

  updateNickName(e) {
    this.setData({
      userName: e.detail.value,
    });
  },

  //提交昵称编辑
  async UdpateUserName() {
    let reg = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/;
    let [name] = [this.data.userName];
    if (name.length >= 2 && name.length <= 8 && reg.test(name)) {
      app.$post('user/info/edit', {
        userName: name
      }).then(_ => {
        wx.navigateBack();
      });
    } else {
      wx.showToast({
        icon: 'none',
        title: '昵称2-8个字符，只支持中英文、数字',
        duration: 2000,
      });
    }
  },
});