const SHOP_SAAS = 'shopSaas';
const app = getApp();
const {
  MachineType
} = app.globalData.utils.Mapping;
const {
  Bluetooth,
  User,
  MachineAfterPay,
  Cache,
  Machine,
  eventBus,
} = app.globalData;
const {
  Http,
  log
} = app.globalData.utils;
Page({
  shopId: null, //店铺id
  timeId: null,
  startLoadTime: null,
  brandName: null,
  unlockedCom: null,
  data: {
    machineType: null,
    phoneText: '4006689966',
    statusText: '请稍等，正在解锁中',
    hasPhone: false,
    mainShow: true, // 主操作界面
    unlockedShow: false, // 显示解锁成功弹框
    showLoading: false,
    unlockedId: null,
    machineId: null, //机器id
    noticeType: null, //通知
    machine: null, //机器详情
    machineName: null,
    isMachineStatus: false, //机器状态错误显示
    statusContent: null,
    statusCode: null,
    shop: {
      vipCreate: true,
    }, // 店铺信息
    choosedFunctionName: null, //选中的机器名
    waterList: [], //出水口列表
    choosedIndex: null, //选中的出水口
    isBle: false,
    openBluetoothShow: false, //是否开启蓝牙
    showSwipper: false,
  },
  onLoad(options) {
    if (options.machineId) {
      Cache.set('machineId', options.machineId);
      this.setData({
        machineId: options.machineId,
        noticeType: app.globalData.isShowNotice,
      });
      this.startLoadTime = Date.now();
    }
  },

  async onShow() {
    const token = await User.check();
    if (token) {
      this.init();
    }
    this.requestOpenBlueTooth();
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
  onHide() {
    clearTimeout(this.timeId);
  },
  onUnload() {
    clearTimeout(this.timeId);
    this.selectComponent('#saveUnlocked') && this.selectComponent('#saveUnlocked').clearTimer();
  },

  async init() {
    this._machine = new MachineAfterPay(this.data.machineId);
    app.globalData._machineAfterPay = this._machine;
    let data = null;
    try {
      data = await this._machine.getMachineDetail();
    } catch (err) {
      wx.hideLoading();
      this.handleMachineError(err);
      return;
    }
    if (data.brandName) {
      Cache.set(SHOP_SAAS, data.brandName);
      this.brandName = data.brandName;
    } else {
      Cache.remove(SHOP_SAAS);
    }
    wx.setNavigationBarTitle({
      title: this.brandName || '企鹅共享'
    });
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    if (data.serviceTelephone || data.serviceTelephone !== '') {
      this.setData({
        hasPhone: true,
        phoneText: data.serviceTelephone,
      });
    }
    let machineType = MachineType[data.parentTypeId];
    this.setData({
      machine: data,
      machineName: data.name,
      machineType,
    });
    this.shopId = data.shopId;
    Cache.set('shopId', this.shopId);
    this.getShopOutline();
    this.getBanner();
    this.isSingle();
    setTimeout(() => {
      eventBus.emit('refreshMarketActivity');
    }, 50);
  },
  // 获取店铺信息
  async getShopOutline() {
    let shopId = this.shopId;
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
  async makeHelp() {
    let url = 'https://h5.qiekj.com/help';
    wx.navigateTo({
      url: `/pages/adWebview/adWebview?linkUrl=${encodeURIComponent(url)}`,
    });
  },
  async isSingle() {
    let list = this._machine.getMachineData().functionList;

    if (list && list.length > 0) {
      let obj = {};
      list = list.reduce((item, next) => {
        obj[next.channel] ? ' ' : (obj[next.channel] = true && item.push(next));
        return item;
      }, []);
      let arr = this.sortByKey(list, 'functionName');
      this.processWaterList(arr);
    }
  },

  //数组对象排序
  sortByKey(array, key) {
    return array.sort(function(a, b) {
      var x = a[key];
      var y = b[key];
      return x < y ? -1 : x > y ? 1 : 0;
    });
  },

  processWaterList(list) {
    if (!list || list.length === 0) return;
    // 默认第一个口
    let choosedIndex =
      this.data.choosedIndex === 0 || this.data.choosedIndex != null ?
      this.data.choosedIndex :
      0;
    let item = list[choosedIndex];

    // 设置功能数据
    this.setData({
      waterList: list,
      choosedIndex,
      choosedFunctionName: item.functionName,
    });
  },

  //蓝牙开启弹窗回调
  openShowBlueTooth(e) {
    this.setData({
      openBluetoothShow: e.detail.status,
    });
  },
  //选择出水口
  onClickItem(e) {
    let index = e.currentTarget.dataset.index;
    let _list = this.data.waterList[index];

    this.setData({
      choosedIndex: index,
      choosedFunctionName: _list.functionName,
    });
  },
  popupBlueToothTip() {
    this.setData({
      openBluetoothShow: true,
    });
  },
  makeCall() {
    wx.makePhoneCall({
      phoneNumber: this.data.phoneText
    });
  },
  handleMachineError(err) {
    let {
      statusCode
    } = Machine.handleMachineError(err);
    wx.setNavigationBarTitle({
      title: '设备故障'
    });
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    });
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#FFFFFF'
    });
    this.setData({
      isMachineStatus: true,
      statusCode,
    });
  },

  // 立即使用
  async useOk() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#FFFFFF'
    });
    await this.requestOpenBlueTooth();
    this.waterUnlock();
  },
  //解锁
  async waterUnlock() {
    // 获取使用口数据
    let item = this.data.waterList[this.data.choosedIndex];

    let id = item.id;

    this.setData({
      showLoading: true,
    });

    try {
      await this._machine.unlock(id);
    } catch (e) {
      if (e && e.msg) {
        log.error('解锁失败，异常: ' + e.msg);
      }
      this.showResult(id, false);
      return;
    }
    log.success('解锁成功');
    this.showResult(id, true);
  },
  //跳转解锁结果
  showResult(id, isSuccess) {
    let dataNow = Date.now();
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    log
      .push({
        unlockTime: dataNow - this.startLoadTime,
      })
      .done();
    if (isSuccess) {
      this.setData({
        showLoading: false,
        unlockedShow: true,
        unlockedId: id,
        mainShow: false,
      });
    } else {
      this.goConnectFailed();
    }
  },

  //跳转连接失败
  goConnectFailed() {
    wx.navigateTo({
      url: `/pages/connectFailed/connectFailed?isBle=${this.data.isBle}&hasPhone=${this.data.hasPhone}&phoneText=${this.data.phoneText}`,
      success: () => {
        this.setData({
          showLoading: false,
          mainShow: true,
        });
      },
    });
  },
  async getBanner() {
    let res = await app.$get('slot/get', {
      shopId: this.shopId,
      machineId: this.data.machineId,
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