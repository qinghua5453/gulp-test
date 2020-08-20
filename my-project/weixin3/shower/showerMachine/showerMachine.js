const app = getApp();
const User = app.globalData.User;
Page({
  positionId: null, //浴室id
  parentOrgId: null, //浴室店铺id
  goodsId: null, //浴位预约id
  orderId: null, //淋浴订单id
  isDisable: false,
  data: {
    isShowPortsPopup: false,
    currentIndex: null,
    goodsName: '', //浴位名称
    isSign: false, //是否开通免密
    showLoading: false,
    list: null, //浴位列表
  },

  async onLoad(options) {
    wx.setNavigationBarTitle({
      title: options.positionName || '企鹅共享'
    });
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    await User.fetchUserData();
    this.positionId = options.positionId;
    this.parentOrgId = options.parentOrgId;
    this.getPositionList();
  },

  onShow() {
    let isRefresh = this.data.isRefresh ? this.data.isRefresh : false;
    if (isRefresh) {
      this.goodsId = null;
      this.orderId = null;
      this.setData({
        isShowPortsPopup: false,
        currentIndex: null,
        goodsName: null,
      });
    }
  },
  async getPositionList() {
    let payload = {
      shopId: this.parentOrgId,
      positionId: this.positionId,
    };
    let res = await app.$post('shower/goods/list', payload);
    this.setData({
      list: res.items || [],
    });
  },

  showPortsPopup() {
    this.setData({
      isShowPortsPopup: true,
    });
  },

  //选择
  goChooseReserve(e) {
    let index = e.currentTarget.dataset.index;
    let _item = this.data.list[index];
    let [busy, id, name] = [_item.busy, _item.id, _item.name];
    if (busy === 1) return;
    this.goodsId = id;
    this.setData({
      currentIndex: index,
      goodsName: name,
      isShowPortsPopup: false,
    });
  },

  //去预约
  async toReserve() {
    if (this.isDisable) {
      return;
    }
    this.isDisable = true;
    if (this.goodsId) {
      let _item = this.data.list.find(item => {
        return item.id === this.goodsId;
      });
      if (_item.busy != 0) {
        wx.showToast({
          icon: 'none',
          title: '您已预约，不可重复预约',
          duration: 1000,
        });
        this.isDisable = false;
        return;
      }
    }
    let flag = await app.$post('alipay/isSign'); //是否开通免密
    if (!flag) {
      this.setData({
        isSign: true,
      });
      return;
    }
    if (!this.goodsId) {
      wx.showToast({
        icon: 'none',
        title: '请选择一个浴位',
        duration: 1000,
      });
      this.isDisable = false;
      return;
    }
    this.appointAdd();
  },

  /**
   * 确认预约
   */
  async appointAdd() {
    this.setData({
      showLoading: true,
    });
    let paylod = {
      goodsId: this.goodsId,
      userId: User.getUid() || '',
    };
    app
      .$post('shower/appoint/add', paylod)
      .then(res => {
        if (res && res.orderId) {
          this.orderId = res.orderId;
          this.addReserveSync();
        }
      })
      .catch(_ => {
        this.isDisable = false;
        this.setData({
          showLoading: false,
        });
      });
  },
  //轮询预约状态
  addReserveSync() {
    app.$post('appoint/sync/' + this.orderId, null, true).then(res => {
      if (res && res.status == 101) {
        this.intiStatus();
      } else {
        this.isDisable = false;
        this.successStatus(res);
      }
    });
  },
  successStatus(res) {
    this.setData({
      showLoading: false,
    });
    wx.navigateTo({
      url: `/shower/previewSuccess/previewSuccess?expireTime=${res.expireTime}&appointOrderId=${res.id}&status=${res.status}`,
    });
  },
  intiStatus() {
    this.timer = setTimeout(() => {
      this.addReserveSync();
    }, 2000);
  },
  closePortsPopup() {
    this.setData({
      isShowPortsPopup: false,
    });
  },
  onSecretPayment() {
    this.isDisable = false;
  },
  onUnload() {
    clearTimeout(this.timer);
    this.timer = null;
  },
  onHide() {
    clearTimeout(this.timer);
    this.timer = null;
  },
});