const app = getApp();
const {
  User,
  Machine
} = app.globalData;
const {
  log
} = app.globalData.utils;
const MACHINE_ATFERPAY_UNLOCK_TIMEOUT = 15;
Page({
  nqt: null,
  disabled: false,
  timer: null,
  data: {
    mainShow: true,
    machineName: null,
    showLoading: false,
    connectFailed: false,
    isMachineStatus: false,
    failedTitle: '连接失败',
    skuId: null,
    banner: true,
    statusCode: null,
    showSwipper: false,
  },
  onLoad(options) {
    this.nqt = options.nqt;
    this.getBanner();
    console.log('nqt is ', this.nqt);
  },

  async onShow() {
    await User.check();
    wx.setNavigationBarColor({
      backgroundColor: '#1677FF',
      frontColor: '#ffffff'
    });
    try {
      let res = await app.$post('goods/scan', {
        NQT: this.nqt,
      });
      this.setData({
        skuId: res[0].skuId,
      });
    } catch (err) {
      this.handleMachineError(err);
    }
  },
  handleMachineError(err) {
    let {
      statusCode
    } = Machine.handleMachineError(err);
    wx.setNavigationBarTitle({
      title: '设备故障'
    });
    wx.setNavigationBarColor({
      backgroundColor: '#FFFFFF',
      frontColor: '#000000'
    });
    this.setData({
      isMachineStatus: true,
      statusCode,
    });
  },
  onHide() {},
  onUnload() {},

  // 立即使用
  async useOk() {
    if (this.disabled) {
      return;
    }
    this.disabled = true;
    try {
      let res = await app.$post('goods/shower/unlock', {
        skuId: this.data.skuId,
      });
      if (res.msgId) {
        this.setData({
          showLoading: true,
          mainShow: false,
        });
        wx.setNavigationBarTitle({
          title: '解锁中'
        });
        wx.setNavigationBarColor({
          backgroundColor: '#FFFFFF',
          frontColor: '#000000'
        });
        this.checkUnlockStatus(res.msgId);
      }
    } catch (err) {
      this.disabled = false;
    }
  },
  retry() {
    wx.setNavigationBarTitle({
      title: '企鹅共享'
    });
    wx.setNavigationBarColor({
      backgroundColor: '#1677FF',
      frontColor: '#ffffff'
    });
    this.setData({
      connectFailed: false,
      mainShow: true,
    });
  },
  unlockSuccess() {
    this.disabled = false;
    this.setData({
      showLoading: false,
      mainShow: false,
      unlockedShow: true,
    });
  },
  unlockFailed() {
    this.disabled = false;
    this.setData({
      showLoading: false,
      mainShow: false,
      connectFailed: true,
    });
  },
  checkUnlockStatus(msgId, i = 1) {
    if (i > MACHINE_ATFERPAY_UNLOCK_TIMEOUT) {
      clearTimeout(this.timer);
      this.unlockFailed();
      return;
    }
    app.$post('machine/msg/sync', {
      msgId
    }).then(res => {
      if (res) {
        if (
          res.state === 'OK' ||
          (res.code === '05' && this.resultBle === '05')
        ) {
          log.push({
            by: '2G',
          });
          clearTimeout(this.timer);
          this.unlockSuccess();
          return;
        } else {
          clearTimeout(this.timer);
          this.unlockFailed();
          return;
        }
      }
      // 没有回码，1s后重试
      i++;
      this.timer = setTimeout(_ => {
        this.checkUnlockStatus(msgId, i);
      }, 1000);
    });
  },
  async getBanner() {
    let res = await app.$get('slot/get', {
      slotKey: 'wx_' + 'ad_water_machine_top',
    });
    if (res) {
      if (res) {
        let swipperList = res.images;
        if (swipperList && swipperList.length > 0) {
          this.setData({
            showSwipper: true,
          });
        } else {
          this.setData({
            showSwipper: false,
          });
        }
      }
    }
  },
});