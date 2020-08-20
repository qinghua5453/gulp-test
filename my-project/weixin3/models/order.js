let app = null;
let Bluetooth = null;
const ORDER_BOOT_TIMEOUT = 30; // 订单启动超时

/**
 * 订单相关逻辑
 */
const Order = {
  privateData: {
    orderId: null,
    orderNo: null,
    detail: {},
    isBle: false,
    msgId: null,
    bleVer: 1,
  },

  // 获取订单详情
  async getDetail(orderId) {
    if (!app) {
      app = getApp();
    }
    if (!orderId) return Promise.reject();
    let data = await app.$post('order/detail', {
      orderId
    });
    if (!data) return Promise.reject();

    this.privateData.orderId = orderId;
    this.privateData.orderNo = data.orderNo;
    this.privateData.detail = data;
    this.privateData.isBle = data.isBluetooth;
    this.privateData.bleVer = data.isisSATACharge * 1 === 1 ? 2 : 1;

    return data;
  },

  // 机器启动
  async boot(order, msgId = null) {
    if (!Bluetooth) {
      app = getApp();
      Bluetooth = app.globalData.Bluetooth;
    }
    let errorMsg = '启动超时';
    // 有msgId，查询回码（因为2G已经发送成功）
    if (msgId) {
      let res = await app.$post('machine/sync', {
        msgId
      });

      if (res) {
        // 有回码, 启动成功
        return true;
      }
    }

    let bleVer = order.isSTATCharge === 1 ? 2 : 1;

    // 启动设备
    let flag = false; // 最终启动状态 true 成功 false 失败
    if (
      bleVer &&
      order.isBluetooth * 1 === 1 &&
      (await Bluetooth.openBluetooth())
    ) {
      let bleCmd = null;
      let msgId = null;
      let bleSdkCmd = null;
      let bleSdkMsgId = null;
      if (bleVer === 2) {
        // 蓝牙2.0 下发指令
        let res = await app.$post('machine/encryption/cmd', {
          type: 5,
          identify: order.orderNo,
        });

        if (res && res.msgId && res.bleCmd) {
          bleCmd = res.bleCmd;
          msgId = res.msgId;
        }

        // 蓝牙2.0 sdk下发订单
        let sdkRes = await app.$post('machine/encryption/cmd', {
          type: 6,
          identify: order.orderNo,
        });

        if (sdkRes && sdkRes.msgId && sdkRes.bleCmd) {
          bleSdkCmd = sdkRes.bleCmd;
          bleSdkMsgId = sdkRes.msgId;
        }
      } else {
        let res = await app.$post('machine/getStartCmd', {
          orderNo: order.orderNo,
        });
        if (res && res.startCmd) {
          bleCmd = res.startCmd;
        }
      }

      if (bleCmd != null) {
        // 连接蓝牙设备
        try {
          await Bluetooth.connect(order.imei);
        } catch (e) {
          errorMsg = '蓝牙连接失败';
          return Promise.reject(errorMsg);
        }
        try {
          let data = await Bluetooth.write(bleCmd, true, msgId);
          if (bleVer === 2) {
            // 00 启动成功 05 msgId去重
            if (data === '00' || data === '05') {
              flag = true;
            }
          } else {
            if (data === '4F6B') {
              flag = true;
            }
          }
        } catch (e) {
          errorMsg = '蓝牙启动超时';
          return Promise.reject(errorMsg);
        }

        if (flag) {
          // 蓝牙返回OK
          wx.showToast({
            icon: 'success',
            title: '启动成功',
            duration: 2000,
          });

          if (bleSdkCmd) {
            await Bluetooth.write(bleSdkCmd, true, bleSdkMsgId);
          }
        } else {
          // 蓝牙发送失败，2G轮询
          try {
            await this.checkBoot(msgId, order);
            flag = true;
          } catch (e) {
            console.log(e);
          }
        }
        // 发送完成断开连接
        Bluetooth.close();
      }
    } else {
      // 2G
      if (msgId) {
        // 有msgId 不下发指令，只查询回码
        try {
          await this.checkBoot(msgId, order);
          flag = true;
        } catch (e) {
          console.log(e);
        }
      } else {
        // 没有msgId，下发指令，并检查回码
        try {
          let res = app.$post('machine/boot', {
            orderId: order.id
          });
          if (res && res.messageId) {
            // 有msgId，轮询接口再返回
            if (
              order.isBluetooth * 1 === 1 &&
              !(await Bluetooth.openBluetooth())
            ) {
              wx.showModal({
                showCancel: false,
                title: '开启蓝牙',
                content: '开蓝牙，设备启动更快捷！',
                confirmText: '知道了',
              });
            }
            await this.checkBoot(res.messageId, order);
            flag = true;
          } else {
            // 没有msgId，直接启动成功
            flag = true;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    if (!flag) {
      return Promise.reject(errorMsg);
    } else {
      return true;
    }
  },

  // 查询是否启动成功(2G)
  checkBoot(msgId, order, i = 1) {
    if (!app) {
      app = getApp();
    }
    return new Promise((resolve, reject) => {
      this.timer = setTimeout(_ => {
        if (i > ORDER_BOOT_TIMEOUT) {
          // 30s 超时没有数据
          console.log('设备启动超时', {
            time: ORDER_BOOT_TIMEOUT + 's'
          });
          reject();
          return;
        }
        if (i % 10 === 0) {
          //隔10秒下发一次启动指令
          app.$post('machine/boot', {
            orderId: order.id
          });
        }
        app
          .$post('machine/sync', {
            msgId: msgId
          })
          .then(res => {
            if (res) {
              resolve();
              return;
            }
            i++;
            this.checkBoot(msgId, order, i)
              .then(data => resolve(data))
              .catch(e => reject(e));
          })
          .catch(e => {
            reject();
          });
      }, 1000);
    });
  },

  clearAllTimeOut() {
    clearTimeout(this.timer);
    this.timer = null;
  },
};

export default Order;