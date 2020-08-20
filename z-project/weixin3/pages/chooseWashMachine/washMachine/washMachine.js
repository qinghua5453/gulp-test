const SHOP_SAAS = 'shopSaas';
const app = getApp();
const {
  MachineType
} = app.globalData.utils.Mapping;
const {
  Machine,
  Cache,
  User,
  eventBus
} = app.globalData;

Page({
  /**
   * 页面的初始数据
   */
  privateData: {
    chooseIndex: null,
  },
  shopId: null,
  currSku: null, //sku列表
  isDisable: false,
  functionName: null,
  data: {
    list: [],
    isShowBtn: false,
    machine: null,
    machineName: null,
    timeMarket: null,
    isTimeMarketStr: false,
    saveText: null,
    savePrice: null,
    id: '', // 机器id
    isWarmMachine: false,
    machine_id: null,
    machineType: null, //机器类型  1洗衣机2烘干机3洗鞋机4吹风机5充电桩6饮水机
    isMachineStatus: false, //机器状态错误显示
    statusCode: null, //机器状态码
    statusContent: null,
    shopId: null,
    isAddScroll: false,
    shop: {
      vipCreate: true,
    }, // 店铺信息
    choosePrice: null, //选中的价格
    originPrice: null, //原价
    chooseFunction: null, // 选中的洗衣模式
    noticeType: null,
    vipDiscount: null, //VIP折扣，
    timeMarketDiscount: null, //限时特惠折扣
  },

  /**
   * 机器详情页 2种情况
   * 1. skip页面跳转过来，machine已经初始化过
   * 2. 其他页面跳转过来，machine没初始化
   */
  onLoad(options) {
    if (options.machineId) {
      Cache.set('machineId', options.machineId);
      this.setData({
        machine_id: options.machineId,
        noticeType: app.globalData.isShowNotice,
      });
    }
  },

  async onShow() {
    const token = await User.check();
    if (token) {
      this.initData();
    }
  },
  initData() {
    this.init(this.data.machine_id);
  },

  onHide() {},

  async init(machineId) {
    // 未初始化设备
    try {
      await Machine.getDetail(machineId);
    } catch (err) {
      Machine.resetData();
      this.handleMachineError(err);
      return Promise.reject(err);
    }
    let data = Machine.privateData.detail;
    this.shopId = data.shopId;
    Cache.set('shopId', this.shopId);
    if (data.brandName) {
      Cache.set(SHOP_SAAS, data.brandName);
    } else {
      Cache.remove(SHOP_SAAS);
    }
    if (data) {
      wx.setNavigationBarTitle({
        title: data.brandName || '企鹅共享'
      });
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      });
      let machineType = MachineType[data.parentTypeId];
      let isWarmMachine = false;
      if (machineType === 2 || machineType === 4) {
        isWarmMachine = true;
      }
      this.setData({
        machine: data,
        machineName: data.name,
        shopId: data.shopId,
        machineType,
        isWarmMachine,
      });
    }
    await this.getShopOutline();
    setTimeout(() => {
      eventBus.emit('refreshMarketActivity');
    }, 50);
  },
  //禁止滚动
  onScrollShow(data) {
    this.setData({
      isAddScroll: data,
    });
  },
  events: {
    onBack() {
      Machine.resetData();
    },
  },

  handleMachineError(err) {
    let {
      statusCode,
      content
    } = Machine.handleMachineError(err);
    if (statusCode) {
      this.setData({
        isMachineStatus: true,
        statusCode,
      });
    } else {
      this.setData({
        isMachineStatus: true,
        statusContent: content,
      });
    }
  },

  // 获取店铺信息
  async getShopOutline() {
    let shopId = this.shopId;
    let machineId = this.data.machine_id;
    try {
      let res = await app.$post('shop/outline', {
        shopId,
        machineId
      });
      if (!res) {
        this.setData({
          isShowBtn: true,
        });
        return;
      } else {
        this.setData({
          shop: res,
          isShowBtn: true,
          timeMarket: res.timeMarket,
          timeMarketDiscount: res.timeMarketDiscount * 1,
          vipDiscount: !res.vipCreate ?
            res.userVipDiscount * 1 :
            res.vipDiscount * 1,
        });
        this.getMachineFunctionList();
      }
    } catch (err) {
      this.setData({
        isShowBtn: true,
      });
    }
  },
  //进入开通店铺VIP
  toCreateVip(e) {
    if (this.isDisable) {
      return;
    }
    let that = this;
    this.isDisable = true;
    let type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/vip/createVip/createVip?shopId=${that.data.shopId}&type=${type}`,
      success: () => {
        that.isDisable = false;
        let url = 'back';
        app.globalData.vipUrl = url;
      },
    });
  },

  /**
     获取设备功能列表
   */
  getMachineFunctionList() {
    // 列表数据
    let list = Machine.privateData.functionList;
    list.forEach(item1 => {
      if (item1.sku) {
        let newArr = [];
        let mergeIndex = null,
          mergeObj = null;
        item1.sku.skus.forEach((sku, index) => {
          sku.isSel = false;
          if (sku.brandTypes === '1') {
            sku.washLiquidIcon = 'washLiquid';
          } else if (sku.brandTypes === '2') {
            sku.washLiquidIcon = 'cleargerm';
          } else if (sku.brandTypes.indexOf(',') !== -1) {
            mergeIndex = index;
            mergeObj = sku;
            sku.washLiquidIcon = 'mergeIcon';
          }
          newArr.push(sku);
        });
        if (mergeIndex) {
          newArr.splice(mergeIndex, 1);
          newArr.push(mergeObj);
        }

        item1.sku.skus = newArr;
      }
    });
    if (list.length > 0) {
      // 默认选择第一个
      let item = this.privateData.chooseIndex ?
        list[this.privateData.chooseIndex] :
        list[0];

      this.setData({
        list,
        id: item.id,
      });
      this.getChoosePrice(item);
    }
  },

  // 机器选中价格和功能
  getChoosePrice(item) {
    // 价格
    let price = this.data.shop.timeMarket ? item.discountPrice : item.price;
    price =
      parseFloat(item.vipDiscountPrice) < parseFloat(price) ?
      item.vipDiscountPrice :
      price;
    let savePrice = null,
      saveText = null;
    if (!this.data.shop.vipCreate) {
      savePrice = parseFloat(item.price) - parseFloat(item.vipDiscountPrice);
      saveText = '会员';
      if (this.data.shop.timeMarket) {
        if (this.data.timeMarketDiscount <= this.data.vipDiscount) {
          savePrice = parseFloat(item.price) - parseFloat(item.discountPrice);
          saveText = '限时';
        } else {
          savePrice =
            parseFloat(item.price) - parseFloat(item.vipDiscountPrice);
          saveText = '会员';
        }
      }
      this.setData({
        isTimeMarketStr: true,
        saveText,
        savePrice,
      });
    } else {
      if (this.data.shop.timeMarket) {
        savePrice = parseFloat(item.price) - parseFloat(item.discountPrice);
        saveText = '限时';
        this.setData({
          isTimeMarketStr: true,
          savePrice,
          saveText,
        });
      }
    }

    let originPrice = parseFloat(item.price);
    this.setData({
      // chooseFunction: item.functionName,
      choosePrice: price,
      originPrice,
    });
    this.functionName = item.functionName;
    eventBus.emit('refreshSKUprice');
  },

  getChooseTotalPrice(e) {
    let currSku = e.detail.currSku;
    let chooseFunction = '';
    if (currSku) {
      let itemSelPrice = parseFloat(currSku.price);
      if (currSku.brandTypes === '1') {
        chooseFunction = '洗衣液';
      } else if (currSku.brandTypes === '2') {
        chooseFunction = '消毒液';
      } else if (currSku.brandTypes.indexOf(',') !== -1) {
        chooseFunction = '洗衣液 消毒液';
      }
      chooseFunction = '+ ' + chooseFunction + '￥' + itemSelPrice.toFixed(2);
      this.currSku = currSku;
    } else {
      chooseFunction = this.functionName;
      this.currSku = null;
    }
    setTimeout(() => {
      this.setData({
        chooseFunction,
      });
    }, 0);
  },
  /**
   * 查询机器功能是否已被预约
   *
   * @param {*} shopId
   * @param {*} setFunctionId
   * @param {*} machineId
   */
  async getMachineFunctionStatus(setFunctionId) {
    let shopId = this.shopId;
    let machineId = this.data.machine_id;
    try {
      let res = await app.$post('appoint/getOneMachineAvailableTime', {
        shopId,
        machineId,
        setFunctionId,
      });
      if (res.status !== 1) {
        let time = encodeURIComponent(res.time);
        wx.redirectTo({
          url: `/reservation/machineStatus/machineStatus?shopId=${shopId}&machineId=${machineId}&setFunctionId=${setFunctionId}&status=${res.status}&time=${time}`,
        });
        return false;
      } else {
        return true;
      }
    } catch (err) {
      return false;
    }
  },

  /**
    选择列表
   */
  chooseMachine(e) {
    let {
      numINDEX,
      machine_item,
      machineId
    } = e.detail;
    this.privateData.chooseIndex = numINDEX;
    this.setData({
      id: machineId,
    });
    this.getChoosePrice(machine_item);
  },

  /**
    立即使用
  */

  async handleUse() {
    if (this.isDisable) {
      return;
    }
    this.isDisable = true;
    let machineFunctionId = this.data.id,
      paramStr = `?machineFunctionId=${machineFunctionId}`,
      url = null;
    if (this.data.machineType === 1) {
      if (await this.getMachineFunctionStatus(machineFunctionId)) {
        url = `/pages/chooseWashMachine/doorClosing/closeTheDoor` + paramStr;
      } else {
        this.isDisable = false;
        return;
      }
    } else {
      url = `/pages/pay/payPreview/payPreview` + paramStr;
    }
    if (this.currSku) {
      url = url + `&skuIds=${this.currSku.skuId}`;
    }
    wx.navigateTo({
      url,
      success: () => {
        this.isDisable = false;
      },
    });
  },
});