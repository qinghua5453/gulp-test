const MACHINE_ATFERPAY_UNLOCK_TIMEOUT = 15; // 机器后付费解锁超时时间
export const STATUS_FAIL = -1;
export const STATUS_LOCKED = 0;
export const STATUS_UNLOCKING = 1;
export const STATUS_UNLOCKED = 2;
export const STATUS_FINISHED = 4;
export const STATUS_FAIL_BLE = -10;
export const STATUS_FAIL_2G = -11;
export const E_STATUS_CHANGED = 'EVENT_UNLOCK_STATUS_CHANGED';
let app = null,
  to,
  padNum,
  Bluetooth,
  Machine,
  http,
  log;

/**
 * 后付费设备逻辑
 */
class MachineAfterPay {
  constructor(machineId) {
    if (!machineId) {
      throw new Error('机器id不能为空');
    }

    this.privateData = {
      machineId: machineId,
      // 功能列表
      list: [],

      timer: null,
      resultBle: null,
      isBle: false,
      is2GFail: false,
      isBLEFail: false,

      unlock: {
        // 解锁口id
        id: null,

        // 解锁状态
        status: STATUS_LOCKED,

        // 是否蓝牙解锁
        isBleUnlock: false,

        // 解锁msgId
        msgId: null,

        // 解锁订单号
        identify: null,

        // 口
        channel: null,
      },
    };

    if (!app) {
      app = getApp();
      to = app.globalData.utils.core.to;
      padNum = app.globalData.utils.core.padNum;
      Bluetooth = app.globalData.Bluetooth;
      Machine = app.globalData.Machine;
      http = app.globalData.utils.Http;
      log = app.globalData.utils.log;
    }
    this.eventBus = app.globalData.eventBus;
    this._machine = Machine;

    this.initEvents();
  }

  initEvents() {
    this.privateData.isBLEFail = false;
    this.privateData.is2GFail = false;
    this.eventBus.on(E_STATUS_CHANGED, (status, msg) => {
      log.push({
        machineId: this.getMachineId(),
      });

      this.privateData.unlock.status = status;

      if (status === STATUS_FAIL_2G) {
        this.privateData.is2GFail = true;
        log.push({
          msg2G: msg,
          status2G: status,
        });
        if (this.privateData.isBle) {
          if (this.privateData.isBLEFail) {
            console.log('unlock STATUS_FAIL_2G is ', Date.now());
            this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '解锁超时');
          }
        } else {
          this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '2G解锁超时');
        }
      }

      if (status === STATUS_FAIL_BLE) {
        this.privateData.isBLEFail = true;
        log.push({
          bleMsg: msg,
          bleStatus: status,
        });

        if (this.privateData.is2GFail) {
          console.log('unlock STATUS_FAIL_BLE is ', Date.now());
          this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '蓝牙解锁超时');
        }
      }
    });
  }

  async destroy() {
    await Bluetooth.close();

    this._machine = null;
    this.eventBus.removeAllListeners();
  }

  async getMachineDetail() {
    let data = await this._machine.getDetail(this.privateData.machineId);
    return data.detail;
  }

  getMachineData() {
    return this._machine.privateData;
  }

  getMachineId() {
    return this.privateData.machineId;
  }

  isUnlocking() {
    return this.privateData.unlock.status === STATUS_UNLOCKING;
  }

  /**
   * 结束事件，回首页
   */
  async handleReLaunch() {
    to(`/pages/home/home`, null, 'reLaunch');
  }

  initBluetooth() {
    let imei = this._machine.getImei();
    return Bluetooth.connect(imei, {
      ver: 2,
      handleCmdback: async up => {
        // 2-3 类型 4-5 状态位 6-13 msgId 14-15 口 16-17 预留 18-end 加密数据
        let type = up.substring(2, 4);
        if (type !== '03') {
          if (type === '00') {
            console.log(
              '蓝牙去重逻辑:云端已发送指令给设备，设备已处理，蓝牙就不再处理了。'
            );
          } else {
            // 不是水，不处理
            console.log('蓝牙CMDBACK上报数据错误, 未知类型 type:', type);
          }
          return;
        }
        let secret = up.substring(18);
        // secret处理
        if (secret) {
          await this.bleSecretUp(secret);
          console.log(111111111111);
          // 断开蓝牙
          await Bluetooth.disconnect();
        }
      },
      handleUp: up => {
        console.log('called');
        // 2-3 类型位
        let type = up.substring(2, 4);

        if (type !== '03') {
          // 不是水，不处理
          console.log('蓝牙Up上报数据错误, 未知类型 type:', type);
          return;
        }

        // 4-5 状态位 6-7 口 8-9 预留 10-end 加密数据
        let status = up.substring(4, 6);
        let channel = up.substring(6, 8);
        let secret = up.substring(10);
        console.log('status is ', status);
        // 结束
        if (status === '01' && secret) {
          this.bleSecretUp(secret).then(list => {
            if (channel !== this.privateData.unlock.channel) {
              return;
            }
            if (list && list.length > 0) {
              let [orderNo, flow] = list[0].split('-');

              this.destroy();
              if (flow > 0 && orderNo) {
                this.eventBus.emit(E_STATUS_CHANGED, STATUS_FINISHED);
                this.privateData.unlock.identify = orderNo;
                if (orderNo) {
                  to(
                    `/pay/afterPay/addOrder/addOrder?id=${orderNo}`,
                    null,
                    'redirect'
                  );
                }
              } else {
                this.handleReLaunch();
              }
            }
          });
        }
      },
    });
  }

  getBluetooth() {
    return this._ble;
  }

  /**
   * 后付费消费结算逻辑
   *
   * @param id 功能id
   */
  async consume(identify) {
    // 不支持蓝牙
    if (!this._machine.isSupportBle()) {
      return;
    }

    // 没有结算订单
    if (!identify) return Promise.reject('[consume]订单号数据错误');

    if (!this.getMachineId()) {
      return Promise.reject('[consume]设备数据错误');
    }

    let res = await http.$post('machine/encryption/cmd', {
      type: 3,
      machineId: this.getMachineId(),
      identify,
    });

    if (!res.bleCmd) {
      return Promise.reject('结算指令获取失败');
    }
    console.log('consume');
    await Bluetooth.write(res.bleCmd);
    return true;
  }

  /**
   * 解锁
   */
  async unlock(id) {
    this.eventBus.removeAllListeners(E_STATUS_CHANGED);
    this.initEvents();
    this.run(id);
    return new Promise((resolve, reject) => {
      this.eventBus.on(E_STATUS_CHANGED, (status, msg = '') => {
        if (status === STATUS_FAIL) {
          console.log('unlock time1 is ', Date.now());
          reject({
            status,
            msg
          });
        }
        if (status === STATUS_UNLOCKED) {
          resolve();
        }
      });
    });
  }
  async run(id) {
    this.privateData.unlock.id = id;
    // 获取口
    let fun = this._machine.getData().functionList.find(item => {
      return item.id === id;
    });
    console.log('fun is ', fun);
    if (!fun) {
      this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '解锁超时');
      return;
    }
    // 临时用functionName补0来解决

    this.privateData.unlock.channel = padNum(fun.functionName, 2);
    this.eventBus.emit(E_STATUS_CHANGED, STATUS_UNLOCKING);
    let httpPromise;
    if (this._machine.isSupportBle()) {
      this.privateData.isBle = true;
      httpPromise = http.$post('machine/encryption/cmd', {
        type: 4,
        machineFunctionId: id,
      });
    } else {
      httpPromise = http.$post('machine/water/unlock', {
        machineFunctionId: id,
      });
    }
    let res = null;
    try {
      res = await httpPromise;
    } catch (e) {
      this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '解锁超时');
      return;
    }

    if (!res || !res.msgId) {
      this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL, '解锁超时');
      return;
    }

    this.privateData.unlock.msgId = res.msgId;
    this.checkUnlockStatus(res.msgId);
    if (this.privateData.isBle) {
      this.useBlueTooth(res);
    }
  }
  async useBlueTooth(res) {
    try {
      await this.initBluetooth();
      // 蓝牙
      let resp = null;
      try {
        resp = await Bluetooth.write(res.bleCmd, true, this.privateData.unlock.msgId);
      } catch (e) {
        this.eventBus.emit(
          E_STATUS_CHANGED,
          STATUS_FAIL_BLE,
          '蓝牙解锁异常，写入数据失败。' + JSON.stringify(e)
        );
        return;
      }
      this.privateData.resultBle = resp;
      console.log('resp is ', resp);
      if (resp === '00') {
        // 解锁成功
        log.push({
          by: 'ble',
        });
        this.privateData.unlock.isBleUnlock = true;
        this.eventBus.emit(E_STATUS_CHANGED, STATUS_UNLOCKED);
        return;
      } else if (resp === '05') {
        console.log(
          '蓝牙去重逻辑:云端已发送指令给设备，设备已处理，蓝牙就不再处理了。'
        );
        this.eventBus.emit(
          E_STATUS_CHANGED,
          STATUS_FAIL_BLE,
          '蓝牙解锁异常，返回值：' + resp
        );
        return;
      } else {
        // 解锁异常
        this.eventBus.emit(
          E_STATUS_CHANGED,
          STATUS_FAIL_BLE,
          '蓝牙解锁异常，返回值：' + resp
        );
        return;
      }
    } catch (e) {
      console.log(e);
      this.eventBus.emit(
        E_STATUS_CHANGED,
        STATUS_FAIL_BLE,
        '解锁异常，蓝牙连接失败' + JSON.stringify(e)
      );
    }
  }

  checkUnlockStatus(msgId, i = 1) {
    if (i > MACHINE_ATFERPAY_UNLOCK_TIMEOUT) {
      clearTimeout(this.privateData.timer);
      this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL_2G, '2G解锁超时');
      return;
    }
    http.$post('machine/msg/sync', {
      msgId
    }).then(res => {
      if (res) {
        if (
          res.state === 'OK' ||
          (res.code === '05' && this.privateData.resultBle === '05')
        ) {
          log.push({
            by: '2G',
          });
          clearTimeout(this.privateData.timer);
          this.eventBus.emit(E_STATUS_CHANGED, STATUS_UNLOCKED);
          return;
        } else {
          clearTimeout(this.privateData.timer);
          this.eventBus.emit(E_STATUS_CHANGED, STATUS_FAIL_2G, '2G解锁异常');
          return;
        }
      }
      // 没有回码，1s后重试
      i++;
      this.privateData.timer = setTimeout(_ => {
        this.checkUnlockStatus(msgId, i);
      }, 1000);
    });
  }

  isBleUnlock() {
    return this.privateData.unlock.isBleUnlock;
  }

  async bleSecretUp(secret) {
    const imei = this._machine.getImei();
    const params = {
      encryptionData: secret,
      imei: imei,
      cmdCode: '0701',
    };
    console.log('bleSecretUp');
    let res = await http.$post('machine/bluetooth/report', params);
    if (res && res.code) {
      if (res.code === '0701') {
        // 给蓝牙发送结算指令
        if (res.orders && res.orders.length > 0) {
          for (let item of res.orders) {
            // orderNo - flow
            let [orderNo] = item.split('-');
            await this.consume(orderNo);
          }
        }
        return res.orders;
      }
    }
    return;
  }
}

export default MachineAfterPay;