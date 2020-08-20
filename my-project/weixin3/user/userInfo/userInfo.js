const app = getApp();
const moment = app.globalData.utils.moment;

Page({
  data: {
    userInfo: {},
    userName: null, //用户昵称
    headImageId: null, // 用户头像
    Editvalue: '',
    sex: ['小哥哥', '小姐姐', '保密哦'],
    index: 2, //性别选择索引,
    endDate: new Date(), //日历结束时间
    date: '2000-06-15', //当前日历展示时间
    value: null,
    userPhone: null,
  },

  onShow() {
    this.getUserInfo();
  },

  getUserInfo() {
    let that = this;
    app.$post('user/info').then(res => {
      let user = res;
      let reg = /^(\d{3})\d{4}(\d+)/;
      that.setData({
        userInfo: user,
        userPhone: user.phone ? user.phone.replace(reg, '$1****$2') : '',
        headImageId: user.headImageId || app.globalData.imgUrl + '/h5/headImg2x.png',
        userName: user.userName || '暂无',
        index: user.sex || 0,
        date: user.birthday || '2000-06-15',
      });
    });
  },

  imageError() {
    this.setData({
      headImageId: app.globalData.imgUrl + '/h5/headImg2x.png',
    });
  },

  //编辑用户昵称
  editUserName() {
    let name = this.data.userInfo ? this.data.userInfo.userName : null;
    wx.navigateTo({
      url: `/user/userInfo/editUserName/editUserName?nickName=${name}`,
    });
  },

  //编辑性别
  editSex(e) {
    this.setData({
      index: e.detail.value,
    });
    this.UdpateUserInfo();
  },

  //编辑生日
  editDate: function(e) {
    let dataValue = moment(e.detail.value).format('YYYY-MM-DD');
    this.setData({
      date: dataValue,
    });
    this.UdpateUserInfo();
  },

  //更新用户信息
  UdpateUserInfo() {
    let that = this;
    app
      .$post('user/info/edit', {
        sex: that.data.index,
        birthday: that.data.date,
      })
      .then(res => {});
  },
});