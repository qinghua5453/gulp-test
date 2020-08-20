let app = null;

const Machine = {
  privateData: {
    machineId: null,

    // 机器类型 0: 其他默认设备 1: 模式一（后付费水） 2: 模式二（充电桩）
    mode: 0,

    // 机器基本信息
    detail: null,

    // 是否支持蓝牙
    isSupportBle: false,

    // 是否支持重复下单
    isRepeatOrder: false,

    // 机器功能数据
    functionList: [],

    // 机器错误码 2 工作中（非重复下单） 4 故障 7 预约 8 长离线（非蓝牙） 9 已删除 10: 阿里不存在 12: 离线（非蓝牙） 13: IOT其他错误
    // 水错误码 21 获取msgId失败 22 蓝牙发送指令错误 23 获取出水口列表失败
    // 订单相关错误码 30 有未支付订单
    code: 0,

    // 机器连接状态 0: 初始化 1: 获取机器数据中（连接中）2: 正常可用 -1: 失败不可用
    connectStatus: 0,

    // 机器启动状态 0: 初始化 1: 启动中 2: 启动正常 -1: 启动失败
    bootStatus: 0,
  },

  async getDetail(machineId) {
    if (!app) {
      app = getApp();
    }
    if (!machineId) return Promise.reject();

    let data = await app.$post('machine/detail', {
      machineId
    });
    if (!data) return Promise.reject();
    this.privateData.machineId = machineId;

    this.privateData.detail = data;
    this.privateData.isSupportBle = data.isBluetooth * 1 === 1;
    this.privateData.isRepeatOrder = data.isRepeatOrder * 1 === 1;

    if (data.isSATACharge * 1 === 1) {
      // 充电桩
      this.privateData.mode = 2;
    } else if (data.isSupportAfterPay * 1 === 1) {
      // 后付费水
      this.privateData.mode = 1;
    } else {
      // 其他设备
      this.privateData.mode = 0;
    }
    // 状态判断
    let status = data.status * 1;

    // 先过滤掉 status 4,8,9
    if (
      status === 4 ||
      status === 9 ||
      (status === 8 && !this.privateData.isSupportBle)
    ) {
      return Promise.reject(status);
    }
    // 不支持蓝牙 提示IOT错误
    let aliDeviceStatus =
      data.company === 'huiren' ? 1 : data.aliDeviceStatus * 1;
    if (!this.privateData.isSupportBle && aliDeviceStatus !== 1) {
      switch (aliDeviceStatus) {
        case 0:
          return Promise.reject(10);
        case 2:
          return Promise.reject(12);
        default:
          return Promise.reject(13);
      }
    }
    //中卡设备
    if (this.privateData.detail && this.privateData.detail.company === 'zhongka') {
      return this.privateData;
    }
    // 后付费水 和 充电桩走新流程
    let res = await this.getFunctionList(machineId);
    switch (this.privateData.mode) {
      case 1:
        // 后付费水，异步
        return this.privateData;
      case 2:
        // 充电桩
        // 查询中
        this.privateData.connectStatus = 1;
        this.getDeviceStatus(res);
        return this.privateData;
      default:
        // 默认设备
        return this.defaultMode();
    }
  },

  async getDeviceStatus(res) {
    try {
      let list = await app.globalData.MachinePrePay.getDeviceStatus(res);
      this.privateData.functionList = list;
      this.privateData.code = 0;
      this.privateData.connectStatus = 2;
    } catch (e) {
      console.log('预付费逻辑错误', e);
      this.privateData.code = e;
      this.privateData.connectStatus = -1;
    }
  },

  // 复位机器数据
  resetData() {
    this.privateData = {
      machineId: null,
      mode: 0,
      detail: {},
      isSupportBle: false,
      isRepeatOrder: false,
      functionList: [],
      code: 0,
      connectStatus: 0,
    };
  },

  async getFunctionList(machineId) {
    if (!app) {
      app = getApp();
    }
    let res = await app.$get('machine/function/list', {
      machineId
    });
    if (res && res.items && res.items.length > 0) {
      this.privateData.functionList = res.items;
    }
    return res;
  },

  defaultMode() {
    return new Promise((resolve, reject) => {
      let status = this.privateData.detail.status * 1;
      // 预约
      if (status === 7) {
        this.reserve(this.privateData.machineId);
        reject(7);
      }
      // 工作中
      if (!this.privateData.isRepeatOrder && status === 2) {
        reject(2);
      }

      resolve(this.privateData);
    });
  },
  getData() {
    return this.privateData;
  },
  getImei() {
    return this.privateData.detail.imei;
  },
  isSupportBle() {
    return this.privateData.isSupportBle;
  },
  // 处理机器预约逻辑
  async reserve(machineId) {
    if (!app) {
      app = getApp();
    }
    let res = await app.$post('order/reserve/list');
    if (res && res.items && res.items.length > 0) {
      let order = res.items.find(item => item.machineId === machineId);
      if (order) {
        // 是自己预约的机器，跳转订单页
        wx.showToast({
          icon: 'none',
          title: '您已预约本机器，请立即使用',
          duration: 2000,
        }).then(_ => {
          wx.redirectTo({
            url: `/pages/order/orderDetail/orderDetail?orderId=${order.id}`,
          });
        });
      }
    }
  },
  handleMachineError(e) {
    // 机器错误码 2 工作中（非重复下单） 4 故障 7 预约 8 长离线（非蓝牙） 9 已删除 10: 阿里不存在 12: 离线（非蓝牙） 13: IOT其他错误
    let content = null,
      statusCode = null;
    switch (e) {
      case 2:
        content = '设备工作中，请更换设备使用';
        break;
      case 4:
        content = '设备故障，请更换设备使用。故障码【4107】';
        statusCode = 4107;
        break;
      case 7:
        content = '设备被预约，请更换设备使用';
        break;
      case 8:
        content = '设备故障,请更换设备使用。故障码【4103】';
        statusCode = 4103;
        break;
      case 9:
        content = '设备故障,请更换设备使用。故障码【4110】';
        statusCode = 4110;
        break;
      case 10:
        content = '设备故障,请更换设备使用。故障码【4201】';
        statusCode = 4201;
        break;
      case 12:
        content = '设备故障,请更换设备使用。故障码【4204】';
        statusCode = 4204;
        break;
      case 13:
        content = '设备故障,请更换设备使用。故障码【4202】';
        statusCode = 4202;
        break;
      default:
        console.log('设备故障');
        break;
    }
    return {
      content,
      statusCode,
    };
  },
};

export default Machine;