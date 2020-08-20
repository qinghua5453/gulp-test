const app = getApp();
const User = app.globalData.User;

Page({
  goodsId: '', ///预约id
  positionId: '',
  timer: null,
  orderId: '',
  data: {
    goodsName: '', ///预约id
    showLoading: false,
    reserveData: {}, // 预约订单信息
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.goodsId = options.goodsId;
    this.positionId = options.positionId;
    this.setData({
      goodsName: options.goodsName,
    });
  },

  async onShow() {
    await User.fetchUserData();
    this.getOrderReservePreview();
  },

  async getOrderReservePreview() {
    let currCenterX = app.globalData.currCenterX;
    let currCenterY = app.globalData.currCenterY;
    if (currCenterX && currCenterY) {
      let payload = {
        positionId: this.positionId,
        longitude: currCenterX,
        latitude: currCenterY,
        userId: User.getUid() || '',
      };
      let res = await app.$post('position/shower/detail', payload);
      this.setData({
        reserveData: res,
      });
    }
  },

  async handleConfirmReserve() {
    this.setData({
      showLoading: true,
    });
    let paylod = {
      goodsId: this.goodsId,
      userId: User.getUid() || '',
    };
    let res = await app.$post('shower/appoint/add', paylod);
    if (res && res.orderId) {
      this.orderId = res.orderId;
      this.addReserveSync();
    }
  },

  //轮询预约状态
  addReserveSync() {
    app.$post('appoint/sync/' + this.orderId, null, true).then(res => {
      if (res && res.status === 101) {
        this.intiStatus();
      } else {
        this.successStatus(res);
      }
    });
  },

  successStatus(res) {
    this.setData({
      showLoading: false,
    });
    wx.redirectTo({
      url: `/shower/previewSuccess/previewSuccess?status=${res.status}&expireTime=${res.expireTime}&orderId=${res.id}`,
    });
  },

  intiStatus() {
    this.timer = setTimeout(() => {
      this.addReserveSync();
    }, 2000);
  },
});