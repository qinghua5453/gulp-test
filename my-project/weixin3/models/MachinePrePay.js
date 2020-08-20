let app = null;
let Bluetooth = null,
  Machine = null;
const STATUS_FAIL = -1;
const STATUS_LOCKED = 0;
const STATUS_UNLOCKING = 1;
const STATUS_UNLOCKED = 2;
const STATUS_FINISHED = 4;
const STATUS_FAIL_BLE = -10;
const STATUS_FAIL_2G = -11;
const E_STATUS_CHANGED = 'EVENT_CHARGE_STATUS_CHANGED';
const MACHINE_PREPAY_CONNECT_TIMEOUT = 10; // 机器后付费连接超时时间
// const MACHINE_PREPAY_UNLOCK_TIMEOUT = 15; // 机器后付费解锁超时时间

/**
 * 预付费设备逻辑
 */
const MachinePrePay = {
  eventBus: null,
  privateData: {
    // 功能列表
    list: [],

    // 是否使用蓝牙
    isBle: false,
    isBLEFail: false,
    // 设备参数
    params: null,
    is2GFail: false,

    // 查询状态 0 未查询 1 查询中 2 查询完成
    status: 0,
  },

  /**
   * 获取后付费水状态
   * @param res functionlist 返回的数据
   */
  initEvents() {
    this.privateData.isBLEFail = false;
    this.privateData.is2GFail = false;
    this.eventBus.on(E_STATUS_CHANGED, (status, msg) => {
      if (status === STATUS_FAIL_2G) {
        this.privateData.is2GFail = true;
        if (this.privateData.isBle) {
          if (this.privateData.isBLEFail) {
            console.log(`unlock STATUS_FAIL_2G `);
            this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '解锁超时');
          }
        } else {
          this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '2G解锁超时');
        }
      }

      if (status === STATUS_FAIL_BLE) {
        this.privateData.isBLEFail = true;
        if (this.privateData.is2GFail) {
          console.log('unlock STATUS_FAIL_BLE ');
          this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '蓝牙解锁超时');
        }
      }
    });
  },
  async useBlueTooth(imei, machineId, res) {
    // 蓝牙
    this.privateData.status = 1;
    // 开始查询
    let data = null;
    try {
      await Bluetooth.connect(imei, {
        handleCmdback: (up) => {
          // 2-3 类型 4-5 状态位 6-13 msgId 14-15 口 16-17 预留 18-end 加密数据
          let type = up.substring(2, 4);
          if (type !== '07') {
            // 不是充电桩，不处理
            console.log('蓝牙CMDBACK上报数据错误, 未知类型 type:', type);
            return;
          }
          let secret = up.substring(18);
          // secret处理
          if (secret) {
            this.bleSecretUp(secret, imei);
          }
        },
      });
    } catch (err) {
      this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL_BLE, '蓝牙连接失败。');
      return;
    }
    try {
      data = await Bluetooth.write(res.bleCmd, true, res.msgId);
      console.log('蓝牙发送查询指令回码', data);
      if (data !== '00') {
        this.eventBus.emit(
          E_STATUS_CHANGED,
          STATUS_FAIL_BLE,
          '蓝牙发送查询指令回码错误'
        );
        return;
      }
    } catch (e) {
      console.log('[MachinePrePay] 蓝牙发送指令错误', e);
      this.eventBus.emit(
        E_STATUS_CHANGED,
        STATUS_FAIL_BLE,
        '[MachinePrePay] 蓝牙发送指令错误' + JSON.stringify(e)
      );
      return;
    }
    Bluetooth.close();

    // 蓝牙出水口列表
    this.getBleChargList(machineId);
  },

  async getDeviceStatus(res) {
    if (!app) {
      app = getApp();
      Bluetooth = app.globalData.Bluetooth;
      Machine = app.globalData.Machine;
      this.eventBus = app.globalData.eventBus;
    }
    this.eventBus.removeAllListeners(E_STATUS_CHANGED);
    this.initEvents();
    this.run(res);
    return new Promise((resolve, reject) => {
      this.eventBus.on(E_STATUS_CHANGED, (status, msg = '') => {
        if (status === STATUS_FAIL) {
          console.log('unlock STATUS_FAIL is ', Date.now());
          reject({
            status,
            msg
          });
        }
        if (status === STATUS_UNLOCKED) {
          resolve(this.privateData.list);
        }
      });
    });
  },

  async run(res) {
    let useBle = false;
    let imei = Machine.privateData.detail.imei;
    let machineId = Machine.privateData.machineId;
    if (!machineId) {
      console.log('[MachinePrePay] 机器未初始化 设备详情: ', Machine.privateData);
      this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '解锁超时');
      return;
    }
    // 记录设备参数
    if (res.quantity) {
      this.privateData.params = res.quantity;
    }
    if (res.items && res.items.length > 0) {
      this.privateData.list = res.items;
    } else {
      this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '解锁超时');
      return [];
    }

    // 蓝牙
    if (
      Machine.privateData.isSupportBle &&
      imei &&
      (await Bluetooth.openBluetooth())
    ) {
      useBle = true;
      this.privateData.isBle = true;
    }

    // 2G 获取出水口列表
    this.get2Gline(machineId);
    if (useBle) {
      this.getBlueTooth(machineId, imei);
    }
  },

  async get2Gline(machineId) {
    let res = null;
    let url = 'machine/water/stateCmd';
    try {
      res = await app.$post(url, {
        type: 1,
        machineId,
      });
      if (!res || !res.msgId) {
        console.log('[MachinePrePay] 获取msgId失败', res);
        this.eventBus.emit(
          E_STATUS_CHANGED,
          STATUS_FAIL_2G,
          '[MachinePrePay] 获取msgId失败'
        );
        return;
      }
    } catch (e) {
      this.eventBus.emit(
        E_STATUS_CHANGED,
        STATUS_FAIL_2G,
        '[MachinePrePay] 获取msgId失败'
      );
      return;
    }
    // 2G 获取出水口列表
    this.getChargList(machineId, res.msgId);
  },

  async getBlueTooth(machineId, imei) {
    let res = null;
    let url = 'machine/encryption/cmd';
    try {
      res = await app.$post(url, {
        type: 1,
        machineId,
      });
      if (!res || !res.bleCmd) {
        console.log('[MachinePrePay] 获取bleCmd失败', res);
        this.eventBus.emit(
          E_STATUS_CHANGED,
          STATUS_FAIL_BLE,
          '[MachinePrePay] 获取bleCmd失败'
        );
        return;
      }
    } catch (e) {
      this.eventBus.emit(
        E_STATUS_CHANGED,
        STATUS_FAIL_BLE,
        '[MachinePrePay] 获取bleCmd失败'
      );
      return;
    }
    if (res.bleCmd) {
      this.useBlueTooth(imei, machineId, res);
    }
  },

  handleListState(listState) {
    // 处理口状态
    let listStateMapping = {};
    for (let item of listState) {
      listStateMapping[item.id] = item;
    }

    this.privateData.list.map((item) => {
      if (listStateMapping[item.id]) {
        item.state = listStateMapping[item.id].state;
        item.isBelong = listStateMapping[item.id].isBelong;
      }
    });
    this.eventBus.emit(E_STATUS_CHANGED, STATUS_UNLOCKED);
  },

  // 获取充电桩口列表(2G)
  getChargList(machineId, msgId, i = 1) {
    if (i > MACHINE_PREPAY_CONNECT_TIMEOUT) {
      console.log('[MachinePrePay.getChargList]超时', {
        time: MACHINE_PREPAY_CONNECT_TIMEOUT + 's',
      });
      clearTimeout(this.timer1);
      this.eventBus.emit(
        E_STATUS_CHANGED,
        STATUS_FAIL_2G,
        '获取充电桩口列表(2G)超时'
      );
      return;
    }
    app.$post('machine/sync', {
      msgId
    }).then((res) => {
      if (!res) {
        // 未收到回码
        this.timer1 = setTimeout((_) => {
          i++;
          this.getChargList(machineId, msgId, i);
        }, 1000);
      } else {
        // 收到回码，调用接口获取口状态
        this.getListState(machineId, msgId);
      }
    });
  },

  // 获取充电桩口列表(蓝牙)
  getBleChargList(machineId, i = 1) {
    if (i > MACHINE_PREPAY_CONNECT_TIMEOUT) {
      // 5s 超时没有数据
      console.log('蓝牙设备上报状态超时', {
        time: MACHINE_PREPAY_CONNECT_TIMEOUT / 2 + 's',
      });
      clearTimeout(this.timerId);
      this.eventBus.emit(
        E_STATUS_CHANGED,
        STATUS_FAIL_BLE,
        'getBleChargList失败。'
      );
      return;
    }
    if (this.privateData.status !== 2) {
      // 继续轮询
      i++;
      this.timerId = setTimeout((_) => {
        this.getBleChargList(machineId, i);
      }, 500);
    } else {
      // 数据上报完成
      this.getListState(machineId);
    }
  },

  /**
   * 解锁
   */
  async unlock(id, msgId = null) {
    if (!app) {
      app = getApp();
      Bluetooth = app.globalData.Bluetooth;
      Machine = app.globalData.Machine;
    }
    this.privateData.unlock.id = id;
    this.privateData.unlock.status = 1;

    let url = 'machine/water/unlock';
    let type = null;
    if (Machine.privateData.isSupportBle && (await Bluetooth.available())) {
      // 蓝牙
      await Bluetooth.connect(Machine.privateData.detail.imei);
      this.privateData.unlock.isBle = true;
      url = 'machine/encryption/cmd';
      type = 4;
    }

    let res = await app.$post(url, {
      type,
      machineFunctionId: id,
      msgId
    });
    if (!res || !res.msgId) {
      this.privateData.unlock.status = -1;
      return Promise.reject('解锁失败');
    }

    this.privateData.unlock.msgId = res.msgId;
    if (res.encryptionCmd) {
      // 蓝牙
      await Bluetooth.write(res.encryptionCmd);
    }

    return res.msgId;
  },

  async bleSecretUp(secret, imei) {
    const params = {
      encryptionData: secret,
      imei: imei,
      cmdCode: '0105',
    };

    let res = await app.$post('machine/bluetooth/report', params);
    console.log('云端数据上报成功', res);
    // 查询完成
    this.privateData.status = 2;
    return res;
  },

  // 获取口状态
  async getListState(machineId, msgId = null) {
    let res = await app.$post('machine/function/listState', {
      machineId,
      msgId,
    });
    let listState = res && res.items.length > 0 ? res.items : [];
    if (listState.length > 0) {
      this.handleListState(listState);
    } else {
      if (!msgId) {
        this.eventBus.emit(
          E_STATUS_CHANGED,
          STATUS_FAIL_BLE,
          'getBleChargList失败。'
        );
      } else {
        this.eventBus.emit(
          E_STATUS_CHANGED,
          STATUS_FAIL_2G,
          '获取充电桩口列表(2G)超时'
        );
      }
    }
  },
};

export default MachinePrePay;