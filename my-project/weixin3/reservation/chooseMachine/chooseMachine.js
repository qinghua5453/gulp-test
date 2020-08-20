const app = getApp();
const {
  ShopMachineType
} = app.globalData.utils.Mapping;

Page({
  machineTypeId: null,
  shopId: null,
  isDisable: false,

  data: {
    type: null,
    list: [],
    shop: {
      vipCreate: true,
    },
    vipDiscount: null, //VIP折扣，
    timeMarketDiscount: null, //限时特惠折扣
    functionId: null,
    isShowReserTime: false, //预约时间弹窗
    recommendTimePopup: false, //推荐时间弹窗
    recommendTimes: [],
    appointStartTime: null,
    appointmentData: {
      dayList: [],
      hourList: [],
      minuteList: [],
      days: [],
      chooseDay: null, // 今天 明天 后天
      chooseDate: null, // 6月3日 18点10分
      chooseHourMinute: null,
    },
  },

  onLoad(options) {
    this.machineTypeId = options.machineTypeId;
    this.shopId = options.shopId;
    this.setData({
      type: options.type,
    });
    console.log('options', options);
    wx.setNavigationBarTitle({
      title: ShopMachineType[options.type] || '企鹅共享'
    });
    wx.setNavigationBarColor({
      backgroundColor: '#fff',
      frontColor: '#ffffff'
    });
  },

  async onShow() {
    this.setData({
      'appointmentData.chooseHourMinute': null,
      recommendTimes: [],
      appointStartTime: null,
      isShowReserTime: false,
      recommendTimePopup: false,
    });
    this.getShopOutline();
  },

  async getShopOutline() {
    let res = await app.$post('shop/outline', {
      shopId: this.shopId
    });
    this.setData({
      shop: res,
      timeMarketDiscount: res.timeMarketDiscount * 1,
      vipDiscount: !res.vipCreate ?
        res.userVipDiscount * 1 :
        res.vipDiscount * 1,
    });
    await this.getMachineFunctionList();
  },

  async getMachineFunctionList() {
    let payload = {
      shopId: this.shopId,
      machineTypeId: this.machineTypeId,
    };
    let res = await app.$post('machineModel/function/list', payload);
    this.setData({
      list: res.items,
    });
    //默认选中第一项
    let _list = this.data.list[0];
    this.machineTypeId = _list.machineTypeId;
    this.setData({
      functionId: _list.id,
    });
  },

  handleSelect(e) {
    let machine_item = e.currentTarget.dataset.item;
    this.machineTypeId = machine_item.machineTypeId;
    this.setData({
      functionId: machine_item.id,
      isShowReserTime: false,
    });
  },

  async openReserTimePopup() {
    let payload = {
      shopId: this.shopId,
      machineTypeId: this.machineTypeId,
      functionId: this.data.functionId,
    };
    let res = await app.$post('appoint/selectTime', payload);
    //默认第一项
    let _list = res.dayList[0];
    let days = [];
    res.dayList.map((item, index) => {
      let date =
        item.value.split('-')[1] + '月' + item.value.split('-')[2] + '日';
      if (index == 0) {
        date = date + ' ' + '今天';
      } else if (index == 1) {
        date = date + ' ' + '明天';
      } else if (index == 2) {
        date = date + ' ' + '后天';
      }
      days.push(date);
    });
    this.setData({
      'appointmentData.dayList': res.dayList,
      'appointmentData.hourList': _list.hourList,
      'appointmentData.minuteList': _list.hourList[0].minuteList,
      'appointmentData.days': days,
      isShowReserTime: true,
    });
  },

  handleConfirmTime(e) {
    let [desc, appointmentData] = [e.detail.desc, e.detail.appointmentData];
    this.setData({
      appointStartTime: desc,
      appointmentData,
      isShowReserTime: false,
    });
  },

  closeReserTime() {
    this.setData({
      isShowReserTime: false,
    });
  },

  handleOrder() {
    if (this.isDisable) {
      return;
    }
    this.isDisable = true;
    this.appointAdd();
  },

  selectDate() {
    // reset time into init
    // 重新请求接口。避免用户停留在已选这个按钮交互很久，重新点击时间选择，此时接口已发生变化。
    this.openReserTimePopup();
    // this.setData({
    //   isShowReserTime: true,
    // });
  },

  async selectRecommendTime(e) {
    if (this.isDisable) {
      return;
    }
    this.isDisable = true;
    let index = e.currentTarget.dataset.index;
    let _list = this.data.recommendTimes[index];
    this.setData({
      appointStartTime: _list.value,
      recommendTimePopup: false,
    });
    await this.appointAdd();
  },

  async appointAdd() {
    let payLoad = {
      shopId: this.shopId,
      machineTypeId: this.machineTypeId,
      functionId: this.data.functionId,
      appointStartTime: this.data.appointStartTime,
    };
    app
      .$post('appoint/add', payLoad)
      .then(res => {
        if (res) {
          if (res.appointOrderId) {
            wx.navigateTo({
              url: `/pages/pay/payPreview/payPreview?machineFunctionId=${res.machineFunctionId}&appointOrderId=${res.appointOrderId}`,
              success: () => {
                this.isDisable = false;
              },
            });
          } else {
            this.isDisable = false;
            let _list = Object.values(res);
            this.setData({
              recommendTimes: _list,
              recommendTimePopup: true,
            });
          }
        }
      })
      .catch(_ => {
        this.isDisable = false;
      });
  },

  renewOpenReserTimePopp() {
    this.setData({
      isShowReserTime: true,
      recommendTimePopup: false,
      recommendTimes: null,
    });
  },
});