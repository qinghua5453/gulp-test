const app = getApp();
const {
  Cache,
  Machine,
  User,
  ZKMachineAfterPay,
  Bluetooth,
  eventBus
} = app.globalData;
const {
  Http,
  log
} = app.globalData.utils;

const SHOP_SAAS = 'shopSaas';

Page({
  data: {
    isTransitionShow: false,
    statusText: '请稍等，正在解锁中',
    machine: null, //机器详情
    shop: {
      vipCreate: true,
    }, // 店铺信息
    machineId: null, //机器id
    shopId: null, //店铺id
    noticeType: null, //通知
    machineType: null, //机器一级类型
    isMachineStatus: false, //机器故障弹窗
    statusCode: null,
    choosedIndex: null, //选中的出水口
    choosedFunctionName: null, //选中的机器名
    isBle: false,
    msgId: null,
    checkedIndex: null,
    unlockTime: 3,
    showLoading: false,
    startLoadTime: Date.now(),
    balanceData: null, //余额转金币
    openBluetoothShow: false, //是否开启蓝牙
    openUnlockResult: false, //解锁结果页
    unlockError: '',
    isShowTransferCoin: false, //余额转金币
  },

  onLoad(options) {
    if (options.machineId || options.commodityId) {
      this.setData({
        machineId: options.machineId || options.commodityId,
        machineData: options.machineData,
        noticeType: app.globalData.isShowNotice,
        startLoadTime: Date.now(),
      });
    }
  },

  onShow() {
    this.setData({
      showLoading: false,
    });
    User.fetchUserData();
    this.init();
  },

  onHide() {
    this.setData({
      checkedIndex: this.data.choosedIndex
    });
  },
  async requestOpenBlueTooth() {
    try {
      let available = await Bluetooth.openBluetoothStepOne();
      this.setData({
        isBle: available,
      });
    } catch (err) {
      console.log('err', err);
    }
  },
  async init() {
    await this.requestOpenBlueTooth();
    if (!this.data.machineId) {
      throw new Error('machine不能为空');
    }

    // 判断登录
    await User.check();

    // 未初始化设备
    let data;
    try {
      data = await Machine.getDetail(this.data.machineId);
    } catch (e) {
      this.handleMachineError(e);
      throw e;
    }

    if (!data) {
      throw new Error('数据获取失败');
    }
    if (data.brandName) {
      Cache.set(SHOP_SAAS, data.brandName);
    } else {
      Cache.remove(SHOP_SAAS);
    }
    wx.setNavigationBarTitle({
      title: data.brandName || '企鹅共享'
    });
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    });
    this.setData({
      machine: data.detail,
      shopId: data.shopId,
    });
    await this.getShopOutline();
    //中卡余额转金币
    this.zhongkaBalance(data.detail.imei);
    setTimeout(() => {
      eventBus.emit('refreshMarketActivity');
    }, 50);
  },

  //中卡余额转金币
  async zhongkaBalance(imei) {
    if (imei) {
      let res = await app.$post('zhong_ka/balance', {
        machineId: imei
      });
      if (res) {
        let total = parseFloat(res.balance + res.withholdAmount);
        if (!res.transferred && parseFloat(total) > 0) {
          this.setData({
            isShowTransferCoin: true,
          });
        } else {
          this.setData({
            isShowTransferCoin: false,
          });
        }
      }
      this.setData({
        balanceData: res,
      });
    }
  },

  //中卡转余额回调
  openShowTransferCoin(e) {
    let data = e.detail;
    this.setData({
      isShowTransferCoin: data,
    });
  },

  handleMachineError(err) {
    let {
      statusCode
    } = Machine.handleMachineError(err);
    if (statusCode) {
      this.setData({
        isMachineStatus: true,
        statusCode,
      });
    }
  },

  // 获取店铺信息
  async getShopOutline() {
    let shopId = this.data.shopId;
    let machineId = this.data.machineId;
    if (shopId && machineId) {
      let res = await Http.$post('shop/outline', {
        shopId,
        machineId
      });
      this.setData({
        shop: res,
      });
    }
  },

  //进入开通店铺VIP
  toCreateVip(e) {
    let that = this;
    let type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/vip/createVip/createVip?shopId=${that.data.shopId}&type=${type}`,
      success() {
        let url = 'back';
        app.globalData.vipUrl = url;
      },
    });
  },

  //重新解锁
  handleTap() {
    this.setData({
      showLoading: false,
      openUnlockResult: false,
    });
    User.fetchUserData();
    this.init();
  },

  // 立即使用
  async useOk() {
    if (!this.data.isBle) {
      this.setData({
        openBluetoothShow: true,
      });
      return;
    }
    if (this.__isLock__ === true) {
      return;
    }
    this.__isLock__ = true;
    try {
      this.setData({
        showLoading: true,
      });
      let machine = new ZKMachineAfterPay(this.data.machineData);
      await machine.unlock();
      log.success('解锁成功');
      this.toUnlockResult(true);
    } catch (e) {
      if (e && e.message && e.message.trim() === '获取解锁指令失败') {
        return;
      }
      log.error('解锁失败，异常:' + JSON.stringify(e));
      this.setData({
        unlockError: e.message,
      });
      this.toUnlockResult(false);
    } finally {
      this.__isLock__ = false;
      log.done();
    }
  },
  openShowBlueTooth(e) {
    this.setData({
      openBluetoothShow: e.detail.status,
    });
  },
  //跳转解锁结果
  toUnlockResult(status) {
    this.setData({
      showLoading: false,
      openUnlockResult: true,
      isLockFailed: !status,
    });
  },
});