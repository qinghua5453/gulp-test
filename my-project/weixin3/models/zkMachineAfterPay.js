import Http from '../utils/Http';
import Bluetooth from './bluetooth';
import core from '../utils/core';
const {
  TYPE_ZHONGKA
} = Bluetooth;
const {
  parseZhongkaMachine
} = core;
export const STATUS_FAIL = -1;
export const STATUS_LOCKED = 0;
export const STATUS_UNLOCKING = 1;
export const STATUS_UNLOCKED = 2;
export const STATUS_FINISHED = 4;
export const STATUS_FAIL_BLE = -10;
export const STATUS_FAIL_2G = -11;
export const E_STATUS_CHANGED = 'EVENT_UNLOCK_STATUS_CHANGED';

/**
 * 后付费设备逻辑
 */
class ZKMachineAfterPay {
  constructor(machineData) {
    if (!machineData) {
      throw new Error('机器id不能为空');
    }

    this.privateData = {
      machineData: machineData,
    };
  }

  /**
   * 解锁
   */
  async unlock() {
    if (!(await Bluetooth.openBluetooth())) {
      throw new Error('蓝牙不可用');
    }

    try {
      const machine = parseZhongkaMachine(this.privateData.machineData);

      const result = await Http.$post('zhong_ka/machine/water/unlock', {
        data: this.privateData.machineData,
      });
      if (!result) {
        throw new Error('获取解锁指令失败');
      }

      await Bluetooth.connect(machine.mac, {
        type: TYPE_ZHONGKA,
      });

      let bleResp = '';
      try {
        bleResp = await Bluetooth.write(result, true);
      } catch (e) {
        throw new Error('蓝牙解锁超时');
      }

      if (bleResp.toUpperCase() !== 'AA') {
        console.log(bleResp);
        throw new Error('蓝牙解锁超时');
      }
    } finally {
      await Bluetooth.close();
    }
  }
}

export default ZKMachineAfterPay;