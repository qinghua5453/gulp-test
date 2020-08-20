const app = getApp();
const {
  moment
} = app.globalData.utils;
Page({
  data: {
    currentTitleId: 1, //当前选中的id
    usingVipList: [],
    datedVipList: [],
    isActiveVip: true,
  },
  onLoad() {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
  },
  onShow() {
    this.getVipList(true);
    this.getVipList(false);
  },

  //点击切换当前选中tab
  titlClickEvent(e) {
    this.setData({
      currentTitleId: e.currentTarget.dataset.id
    });
  },

  //获取用户VIP列表
  getVipList(_isActiveVip) {
    let that = this;
    app.$post('user/vip/list', {
      isActiveVip: _isActiveVip
    }).then(res => {
      for (let item of res.items) {
        item.isVipDetailShow = false;
        item.availableTime = moment(item.availableTime).format('YYYY.MM.DD');
        for (let list of item.memberVipCardList) {
          list.availableTime = moment(list.availableTime).format('YYYY.MM.DD');
          list.activeTime = moment(list.activeTime).format('YYYY.MM.DD');
          list.shopNames = list.shopNames.toString();
        }
      }
      _isActiveVip
        ?
        that.setData({
          usingVipList: res.items || []
        }) :
        that.setData({
          datedVipList: res.items || []
        });
    });
  },
});