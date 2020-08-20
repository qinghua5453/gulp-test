/* eslint-disable no-unused-vars */
import EventEmitter from 'eventemitter3';
import log from '../utils/log';
import Http from '../utils/Http';

const BLE_CONNECT_TIMEOUT = 8; // 蓝牙连接超时时间
const BLE_CMDBACK_TIMEOUT = 15; // 蓝牙发送指令监听返回超时时间
const hexToString = (hex) => {
  var string = '';
  for (var i = 0; i < hex.length; i += 2) {
    let t1 = hex.substr(i, 2);
    string += String.fromCharCode(parseInt(t1, 16));
  }
  return string;
};
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit) {
    return ('00' + bit.toString(16)).slice(-2);
  });
  return hexArr.join('');
}
function hex2ab(str) {
  let length = str.length / 2;
  let buffer = new ArrayBuffer(length);
  let dataView = new DataView(buffer);
  for (var i = 0; i < length; i++) {
    let index = i * 2;
    let number = parseInt(str.substr(index, 2), 16);
    dataView.setInt8(i, number);
  }
  return buffer;
}
const stringToHex = (str) => {
  var val = '';
  for (var i = 0; i < str.length; i++) {
    if (val == '') {
      val = str.charCodeAt(i).toString(16);
    } else {
      val += str.charCodeAt(i).toString(16);
    }
  }
  return val;
};
export const STATUS_DISCONNECT = 'STATUS_DISCONNECT';
export const STATUS_CONNECTED = 'STATUS_CONNECTED';
export const STATUS_TIMEOUT = 'STATUS_TIMEOUT';

export const E_RESPONSE = 'EVENT_RESPONSE';

const noop = function () {};

// 企鹅固定的id
const SERVICE_ID = 'edfec62e-9910-0bac-5241-d8bda6932a2f';
const NOTIFY_ID = '6c290d2e-1c03-aca1-ab48-a9b908bae79e';
const WRITE_ID = '772ae377-b3d2-4f8e-4042-5481d1e0098c';

export const TYPE_NORMAL = 1;
export const TYPE_ZHONGKA = 2;

class Bluetooth {
  constructor() {
    this.event = new EventEmitter();
    this.timerId = null;
    this.state = {
      isSending: false, // 是否发送中
      deviceId: null,
      RSSI: 0,
      status: STATUS_DISCONNECT, // 设备状态
      connected: false,
      // 发送数据流
      sendData: '',
      // 蓝牙返回数据集合(根据msgId存储) 0 表示没有msgId，兼容老模块，用于判断4F6B
      bleResp: {},
      // 蓝牙上报数据流
      dataStream: '',
      name: '',
      serviceId: SERVICE_ID,
      readId: NOTIFY_ID,
      notifyId: NOTIFY_ID,
      writeId: WRITE_ID,
    };
  }

  async connect(imei, options = {}) {
    if (!imei) {
      throw new Error('必须填 imei');
    }

    // TODO 删除
    try {
      await this.close();
    } catch (err) {
      console.log(err);
    }

    this.stateProps = Object.assign(
      {
        imei: imei,
        ver: options.ver || 2, // 蓝牙上报处理逻辑版本 1.0 / 2.0
        handleCmdback: noop,
        handleUp: noop,
        type: TYPE_NORMAL,
      },
      options
    );
    return Promise.race([
      this.timeout(BLE_CMDBACK_TIMEOUT, '蓝牙连接超时', () => {
        this.setState({
          status: STATUS_TIMEOUT,
        });
        console.log('蓝牙连接超时111');
        this.stopBluetoothDevicesDiscovery();
      }),
      this.start(),
    ]);
  }

  async available() {
    return new Promise((resolve, reject) => {
      wx.getBluetoothAdapterState({
        success: (res) => {
          console.log('蓝牙可用！');
          resolve(res.available);
        },
        fail: (error) => {
          console.log('蓝牙不可用！');
          reject(error);
        },
      });
    });
  }

  async close() {
    if (await this.disconnect()) {
      return new Promise(async (resolve, reject) => {
        this.event.removeAllListeners();
        wx.offBLEConnectionStateChanged();
        wx.offBLECharacteristicValueChange();
        this.stopBluetoothDevicesDiscovery(resolve, reject);
      });
    } else {
      return;
    }
  }

  setState(state) {
    this.state = Object.assign({}, this.state, state);
  }

  async openBluetoothStepOne() {
    return new Promise((resolve, reject) => {
      wx.openBluetoothAdapter({
        success: (res) => {
          resolve(true);
        },
        fail: (error) => {
          reject(error);
        },
      });
    });
  }
  async openBluetooth() {
    try {
      let available = await this.openBluetoothStepOne();
      return available;
    } catch (err) {
      return false;
    }
  }

  async start() {
    return new Promise(async (resolve, reject) => {
      try {
        let deviceId = await this.onFound();
        await this.connectDevice(deviceId);
        resolve(true);
        clearTimeout(this.timerId);
        if (this.stateProps.type === TYPE_ZHONGKA) {
          await this.getServiceId();
          await this.getCharacteristicId();
          await this.startNotify();
          return await this.write('AA');
        } else {
          let isNotify = await this.startNotify();
          console.log('isNotify is ', isNotify);
        }
      } catch (err) {
        console.log('start bluetooth connect failed!');
        reject(err);
      }
    });
  }

  async onFound() {
    return new Promise((resolve, reject) => {
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        success: () => {
          wx.onBluetoothDeviceFound((res) => {
            if (res.devices) {
              let deviceId = this.findDeviceByImei(res.devices);
              if (deviceId) {
                console.log('deviceId is ', deviceId);
                // 开始连接
                resolve(deviceId);
              }
            }
          });
        },
        fail: (error) => {
          let content = '启动扫描失败：' + JSON.stringify(error);
          reject({
            content,
          });
        },
      });
    });
  }

  async getServiceId(serviceChar = 'FFE0') {
    let services = await this.getServices();
    let found = false;
    for (let i = 0; i < services.length; i++) {
      let serviceId = services[i].serviceId;
      let upCase = serviceId.toUpperCase();
      if (upCase.indexOf(serviceChar) > -1) {
        this.setState({
          serviceId,
        });
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error('找不到serviceId');
    }
  }

  getServices() {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceServices({
        deviceId: this.state.deviceId,
        success: (res) => {
          console.log(res);
          resolve(res.services);
        },
        fail: (res) => {
          reject(res);
        },
      });
    });
  }

  getCharacteristics() {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceCharacteristics({
        deviceId: this.state.deviceId,
        serviceId: this.state.serviceId,
        success: (res) => {
          resolve(res.characteristics);
        },
        fail: (res) => {
          reject(res);
        },
      });
    });
  }

  getCharacteristicId({
    notifyChar = 'FFE1',
    writeChar = 'FFE2',
    readChar = 'FFE3',
  } = {}) {
    return new Promise((resolve, reject) => {
      this.getCharacteristics()
        .then((e) => {
          console.log(e);
          if (e.length === 1) {
            this.setState({
              readId: e[0].characteristicId,
              writeId: e[0].characteristicId,
              notifyId: e[0].characteristicId,
            });
            resolve();
          } else {
            for (let i = 0, len = e.length; i < len; i++) {
              if (e[i].characteristicId.toUpperCase().indexOf(writeChar) > -1) {
                this.setState({
                  writeId: e[i].characteristicId,
                });
              } else if (
                e[i].characteristicId.toUpperCase().indexOf(readChar) > -1
              ) {
                this.setState({
                  readId: e[i].characteristicId,
                });
              } else if (
                e[i].characteristicId.toUpperCase().indexOf(notifyChar) > -1
              ) {
                this.setState({
                  notifyId: e[i].characteristicId,
                });
              }
            }

            resolve();
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  // 开始连接设备
  connectDevice(deviceId) {
    return new Promise((resolve, reject) => {
      console.log('deviceId is ', deviceId);
      wx.createBLEConnection({
        deviceId: deviceId,
        success: () => {
          this.setState({
            deviceId,
            status: STATUS_CONNECTED,
          });
          console.log('蓝牙连接成功');
          resolve();
        },
        fail: (err) => {
          console.log('蓝牙连接失败 is ' + JSON.stringify(err));
          reject(err);
        },
      });
    });
  }

  /**
   * 向蓝牙发送数据（乐观锁）
   * 1. 转换16进制
   * 2. 分包发送
   *
   * @param data 需要发送的加密数据
   */
  async write(data, isReceiveData = false, msgId = null) {
    if (!data) {
      console.log('数据不存在');
      return Promise.reject('数据不存在');
    }

    if (this.state.isSending) {
      // 如果在发送中，过3秒后重试
      setTimeout(() => {
        this.write(data, isReceiveData, msgId);
      }, 3000);
      return;
    }

    // 转换16进制
    if (this.stateProps.type === TYPE_NORMAL) {
      data = '0A' + stringToHex(data) + '0A';
    }

    // 清空回码数据
    this.setState({
      bleResp: {},
    });
    // 分包发送
    wx.showLoading({
      title: '蓝牙数据发送中...',

      mask: true,
    });

    let res = null;

    if (isReceiveData) {
      // 不需要await
      res = this.checkData(msgId);
    }
    // 加锁
    this.state.isSending = true;

    try {
      console.log('蓝牙发送数据中', data);
      if (isReceiveData) {
        await this.writeBLECharacteristicValue(data);
      } else {
        res = await this.writeBLECharacteristicValue(data);
      }
      console.log('蓝牙发送成功');
    } catch (e) {
      res = false;
      console.log('蓝牙写入数据失败', data, e);
      log.error('蓝牙写入数据失败' + JSON.stringify(e));
      throw e;
    } finally {
      this.state.isSending = false;
    }

    return res;
  }

  // 断开蓝牙
  async disconnect() {
    if (this.state.deviceId) {
      return new Promise((resolve, reject) => {
        wx.closeBLEConnection({
          deviceId: this.state.deviceId,
          success: () => {
            this.setState({
              deviceId: null,
            });
            resolve(true);
          },
          fail: (error) => {
            console.log('断开蓝牙设备失败', error, this.state);
            log.error('断开蓝牙设备失败' + JSON.stringify(error));
            reject(error);
          },
        });
      });
    }
    return false;
  }
  stopBluetoothDevicesDiscovery(resolve, reject) {
    wx.stopBluetoothDevicesDiscovery({
      success: (res) => {
        wx.offBluetoothDeviceFound();
        if (resolve) {
          resolve();
        }
      },
      fail: (error) => {
        console.log('蓝牙终止扫描失败', error);
        if (reject) {
          reject(error);
        }
      },
    });
  }
  // 通过imei查找设备
  findDeviceByImei(devices) {
    const imei = this.stateProps.imei;
    if (!imei) {
      console.log('请先设置imei');
      return false;
    }

    if (this.stateProps.type === TYPE_ZHONGKA) {
      return this.findZhongKaDevice(devices);
    }
    // imei='865650040796456';
    // '865650040796456'
    // 判断识别规则
    if (devices && devices.length > 0) {
      for (let device of devices) {
        let result = ab2hex(device.advertisData);
        let advertisData = hexToString(result);
        // 用search的原因是：IOS会返回一串，里面包含imei
        if (advertisData && advertisData.search(imei) !== -1) {
          this.stopBluetoothDevicesDiscovery();
          this.setState({
            deviceId: device.deviceId,
            RSSI: device.RSSI,
            name: device.name,
          });
          return device.deviceId;
        }
      }
    }

    return false;
  }

  findZhongKaDevice(devices) {
    if (devices.length == 1) {
      let advertisData = devices[0].advertisData.toUpperCase();
      // if (advertisData && advertisData.indexOf(mac) != -1) {
      if (advertisData && advertisData.substr(-12) === this.stateProps.imei) {
        return devices[0].deviceId;
      }
    } else {
      for (let i = 0, len = devices.length; i < len; i++) {
        let advertisData = hexToString(devices[i].advertisData).toUpperCase();

        if (advertisData && advertisData.indexOf(this.stateProps.imei) > -1) {
          return devices[i].deviceId;
        }
      }
    }
  }

  // 初始化设备，包括服务，特征值等
  startNotify() {
    return new Promise((resolve, reject) => {
      // 监听notify特征值
      wx.notifyBLECharacteristicValueChange({
        deviceId: this.state.deviceId,
        serviceId: this.state.serviceId,
        characteristicId: this.state.notifyId,
        state: true,
        success: (kt) => {
          console.log(
            'notifyBLECharacteristicValueChange is ',
            JSON.stringify(kt)
          );
          wx.onBLECharacteristicValueChange((res) => {
            resolve(true);
            let value = ab2hex(res.value);
            value = value.toUpperCase();
            console.log('CharacteristicValue hex is ', value);
            this.onBleResp(value);
          });
        },
        fail: (res) => {
          reject(res);
        },
      });
    });
  }

  async read() {
    let resp = await wx.readBLECharacteristicValue({
      deviceId: this.state.deviceId,
      serviceId: this.stateProps.serviceId,
      characteristicId: this.state.notify,
    });
    console.log(resp);
  }

  // 通过小程序发送指令
  async writeBLECharacteristicValue(data) {
    if (!data) return Promise.reject('数据不存在');

    let rawData = data;
    // 拆包
    let arr = [];
    let max = 40;
    while (data.length > 0) {
      let tmp = data.slice(0, max);
      data = data.slice(max);
      arr.push(tmp);
    }

    let index = 0,
      length = arr.length;
    // 发送完成，上报数据
    Http.$post('machine/bluetooth/log', {
      encryptionData: rawData,
      imei: this.stateProps.imei,
    });
    return new Promise((resolve, reject) => {
      for (let item of arr) {
        let value = hex2ab(item);
        console.log('value is ', value);
        wx.writeBLECharacteristicValue({
          deviceId: this.state.deviceId,
          serviceId: this.state.serviceId,
          characteristicId: this.state.writeId,
          value,
          success: (resp) => {
            index++;
            if (index === length) {
              console.log('写入数据成功！', JSON.stringify(resp));
              resolve(true);
            }
          },
          fail: (error) => {
            console.log('写入数据失败！');
            reject(error);
          },
        });
      }
    });
  }

  // 获取到蓝牙上报的数据
  // 1. data === OK
  // 2. data 需要分包获取，上报云端
  onBleResp(data) {
    console.log('获取到蓝牙上报的数据', data);
    if (!data) return;
    if (this.stateProps.type === TYPE_NORMAL) {
      if (data.toUpperCase() === '4F6B') {
        // 收到OK
        this.setState({
          bleResp: Object.assign({}, this.state.bleResp, {
            0: data,
          }),
        });
      } else {
        // 其他数据当作分包数据处理
        this.setState({
          dataStream: this.state.dataStream + data,
        });
        if (data.indexOf('0A') !== -1) {
          // 收到尾包， 上报数据
          this.updata();
        }
      }
    } else if (this.stateProps.type === TYPE_ZHONGKA) {
      this.setState({
        bleResp: {
          0: data,
        },
      });
    }
    this.event.emit(E_RESPONSE);
  }

  // 获取蓝牙数据
  updata() {
    let data = this.state.dataStream;
    console.log('updata is ', data);
    let endPos = data.indexOf('0A');
    if (endPos === -1) {
      // 没有结束符，不处理
      return;
    }

    // 提取需要处理的数据
    let up = data.substring(0, endPos);

    // 删除已发送的数据
    this.setState({
      dataStream: data.substring(endPos + 2),
    });

    if (this.stateProps.ver === 1) {
      // 蓝牙1.0 处理逻辑，直接上报服务端
      // 16转string
      up = hexToString(up);

      const params = {
        encryptionData: up,
        imei: this.stateProps.imei,
      };

      Http.$post('machine/bluetooth/report', params).then((res) => {
        console.log('云端数据上报成功', up);
      });
    } else if (this.stateProps.ver === 2) {
      // 蓝牙2.0 处理逻辑
      up = hexToString(up);
      console.log('蓝牙2.0-0', up);

      // 0-1 识别位
      let tag = up.substring(0, 2);
      switch (tag) {
        case '01':
          // cmdback
          this.receiveCmdback(up);
          break;
        case '02':
          // up
          this.receiveUp(up);
          break;
        default:
          break;
      }
    }
  }

  /**
   * 蓝牙上报——cmdback
   */
  receiveCmdback(up) {
    // 2-3 类型 4-5 状态位 6-13 msgId 14-15 口 16-17 预留 18-end 加密数据
    let status = up.substring(4, 6);
    let msgId = up.substring(6, 14);
    if (!msgId) {
      // 数据错误，不处理
      console.log('蓝牙2.0 为获取到正确的msgId', up);
      return;
    }

    this.setState({
      bleResp: Object.assign({}, this.state.bleResp, {
        [msgId]: status,
      }),
    });

    if (this.stateProps.handleCmdback) {
      this.stateProps.handleCmdback(up);
    }
  }

  receiveUp(up) {
    // 2-3 类型位
    if (this.stateProps.handleUp) {
      this.stateProps.handleUp(up);
    }
  }

  // 监听模块返回值
  checkData(msgId) {
    return Promise.race([
      this.timeout(BLE_CMDBACK_TIMEOUT, '设备返回数据超时'),
      new Promise((resolve, reject) => {
        this.event.removeAllListeners(E_RESPONSE);
        this.event.on(E_RESPONSE, () => {
          if (!msgId && this.state.bleResp[0]) {
            // 4F6B
            // clearTimeout(this.timerId);
            resolve(this.state.bleResp[0]);
          } else if (msgId && this.state.bleResp[msgId]) {
            // todo 接受到相关数据需要进行业务处理
            // clearTimeout(this.timerId);
            resolve(this.state.bleResp[msgId]);
          }
        });
      }),
    ]);
  }

  timeout(time = 1, txt = '超时', callback = () => {}) {
    return new Promise((resolve, reject) => {
      this.timerId = setTimeout(() => {
        // 10s 超时没有数据
        callback(this.timerId);
        reject(txt);
      }, time * 1000);
    });
  }
}
const blueTooth = new Bluetooth();

export default blueTooth;
