const app = getApp();
const {
  User,
  Machine,
  Cache,
  MachinePrePay,
  eventBus
} = app.globalData;
const {
  TimeUnit
} = app.globalData.utils.Mapping;
Page({
  unitPrice: 0, //充电桩单价
  discountPrice: 0, // 折后单价
  btnDisable: false,
  timerId: null,
  shopId: null,
  data: {
    newList: [],
    isMachineStatus: false,
    title: '连接失败',
    statusCode: null,
    statusContent: null,
    connectFailedShow: false,
    isTransitionShow: true,
    machineName: null,
    machineId: null, //机器id
    noticeType: null, //通知
    chargTime: null, //当前时间
    valueUnit: null, //充电桩时间单位
    quantity: null, // 充电桩时间信息
    machine: null, // 机器详情
    statusText: '', // 机器状态文字
    choosedIndex: null, //选中的出水口
    isAddActive: false, //充电桩是否可用
    choosedFunctionName: null, //充电桩默认名称
    choosePrice: null, // 优惠价格
    isShowPortsPopup: false,
    phoneText: '4006689966',
    hasPhone: false,
    showSwipper: false,
  },
  onLoad(options) {
    if (options.machineId) {
      this.channel = options.channel;
      Cache.set('machineId', options.machineId);
      this.setData({
        machineId: options.machineId,
        noticeType: app.globalData.isShowNotice,
      });
    }
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#FFFFFF'
    });
    app.globalData.isckLaundry = false;
  },

  async onShow() {
    let token = await User.check();
    if (token) {
      this.init(this.data.machineId);
    }
  },
  retry() {
    this.setData({
      connectFailedShow: false,
      isTransitionShow: true,
    });
    wx.setNavigationBarTitle({
      title: '连接中...'
    });
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    });
    this.init(this.data.machineId);
  },
  async init(machineId) {
    let data;
    try {
      await Machine.getDetail(machineId);
      data = Machine.privateData.detail;
      if (data.serviceTelephone || data.serviceTelephone !== '') {
        this.setData({
          hasPhone: true,
          phoneText: data.serviceTelephone,
        });
      }
      this.shopId = data.shopId;
      Cache.set('shopId', this.shopId);
      this.setData({
        machine: data,
        machineName: data.name,
        statusText: data.status == 21 ? '工作' : '空闲',
      });
      this.getBanner();
    } catch (e) {
      this.handleMachineError(e);
      return Promise.reject(e);
    }
    try {
      await this.checkMachineStatus();
      let list = Machine.privateData.functionList;
      this.processChargList(list);
      this.getShopOutline();
      setTimeout(() => {
        eventBus.emit('refreshMarketActivity');
      }, 50);
    } catch (e) {
      console.log('checkMachineStatus error', e);
      this.goConnectFailed();
    }
  },
  goConnectFailed() {
    this.setData({
      connectFailedShow: true,
      isTransitionShow: false,
    });
  },
  checkMachineStatus() {
    return new Promise((resolve, reject) => {
      switch (Machine.privateData.connectStatus) {
        case 2:
          clearTimeout(this.timerId);
          resolve(true);
          break;
        case -1:
          clearTimeout(this.timerId);
          reject(Machine.privateData.code);
          break;
        default:
          this.timerId = setTimeout(_ => {
            this.checkMachineStatus()
              .then(data => resolve(data))
              .catch(e => reject(e));
          }, 500);
          break;
      }
    });
  },
  processChargList(list) {
    if (!list || list.length === 0) return;
    if (this.channel || this.channel === 0) {
      let item = null;
      let i = list.findIndex(item => item.channel === this.channel);
      if (i >= 0) {
        item = list[i];
      }
      if (
        item &&
        (item.state * 1 === 1 ||
          (item.state * 1 === 0 && item.isBelong * 1 === 1))
      ) {
        // 状态空闲，或 工作中 & 属于自己 -> 默认选择口
        this.setData({
          choosedIndex: i,
          isAddActive: true,
          choosedFunctionName: item.channel,
        });
      }
    }

    // 设备参数
    let quantity = MachinePrePay.privateData.params;

    if (!quantity) {
      console.log('设备参数错误', MachinePrePay.privateData);
      return;
    }
    wx.setNavigationBarTitle({
      title: '选择时间'
    });
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    });
    let choosetime = this.data.chargTime || quantity.defaultValue;
    let unitPrice = list[0].price;
    quantity.minValue = parseFloat(quantity.minValue).toFixed(0);
    quantity.maxValue = parseFloat(quantity.maxValue).toFixed(0);
    quantity.stepValue = parseFloat(quantity.stepValue);
    // 设置功能数据
    this.unitPrice = unitPrice;
    this.setData({
      newList: list,
      valueUnit: TimeUnit[quantity.valueUnit],
      quantity,
      chargTime: choosetime,
      // unLoading
      isTransitionShow: false,
      connectFailedShow: false,
    });
  },
  //获取店铺信息
  async getShopOutline() {
    let shopId = this.shopId;
    let machineId = this.data.machineId;
    let res = await app.$post('shop/outline', {
      shopId,
      machineId
    });
    if (res) {
      let marketDiscountPrice = this.data.newList[0].discountPrice;
      let vipDiscountPrice = this.data.newList[0].vipDiscountPrice;

      let price = res.timeMarket ? marketDiscountPrice : this.unitPrice;
      price = !res.vipCreate && parseFloat(vipDiscountPrice) < parseFloat(price) ?
        vipDiscountPrice :
        price;
      this.discountPrice = price;
      this.setData({
        shop: res,
      });
    }
    this.changePrice();
  },
  handleMachineError(err) {
    let {
      statusCode,
      content
    } = Machine.handleMachineError(err);
    if (statusCode) {
      this.setData({
        isTransitionShow: false,
        isMachineStatus: true,
        statusCode,
      });
    } else {
      this.setData({
        isTransitionShow: false,
        isMachineStatus: true,
        statusContent: content,
      });
    }
  },
  //选择充电桩
  onClickItem(e) {
    let {
      index,
      used
    } = e.target.dataset;
    if (used) {
      return;
    }
    let _list = this.data.newList[index];
    this.id = _list.id;

    if (_list.state == 1) {
      //空闲
      this.setData({
        choosedIndex: index,
        isAddActive: true,
        choosedFunctionName: _list.channel,
      });
    } else if (_list.state == 0 && _list.isBelong == 1) {
      //工作 属于个人
      this.setData({
        isAddActive: true,
        choosedIndex: index,
        choosedFunctionName: _list.channel,
      });
    } else {
      this.setData({
        isAddActive: false,
        choosedFunctionName: null,
      });
    }
    this.closePortsPopup();
  },
  showPortsPopup() {
    this.setData({
      isShowPortsPopup: true,
    });
  },
  closePortsPopup() {
    this.setData({
      isShowPortsPopup: false,
    });
  },
  // 充电桩价格
  changePrice() {
    this.setData({
      choosePrice: parseFloat(this.data.chargTime * this.discountPrice),
    });
  },
  //立即使用
  useOk() {
    if (this.btnDisable) {
      return;
    }
    this.btnDisable = true;

    let id = this.data.newList[this.data.choosedIndex].id;
    let num = this.data.chargTime;
    switch (this.data.quantity.valueUnit) {
      case 'm':
        num *= 60;
        break;
      case 'h':
        num *= 3600;
        break;
    }
    wx.navigateTo({
      url: `/pages/pay/payPreview/payPreview?machineFunctionId=${id}&num=${num}`,
      success: () => {
        this.btnDisable = false;
      },
    });
  },
  //充电桩时间滑动组件回调
  sliderchange(e) {
    let chargTime = e.detail.chargTime;
    let choosePrice = chargTime * this.discountPrice;
    this.setData({
      chargTime,
      choosePrice: parseFloat(choosePrice),
    });
  },
  async getBanner() {
    let res = await app.$get('slot/get', {
      shopId: this.shopId,
      machineId: this.data.machineId,
      slotKey: 'wx_' + 'ad_choose_machine_top',
    });
    if (res) {
      if (res) {
        let swipperList = res.images;
        let showType = res.showType;
        if (showType * 1 === 2 && swipperList && swipperList.length > 0) {
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