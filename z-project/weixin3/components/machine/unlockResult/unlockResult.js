const app = getApp();
const {
  log
} = app.globalData.utils;
Component({
  data: {
    openUnlockResult: true, //解锁结果页
  },
  properties: {
    isLockFailed: {
      type: Boolean,
      value: false
    }, //解锁状态
    unlockError: {
      type: String,
      value: ''
    }, //解锁异常原因
    machine: {
      type: String,
      value: ''
    }, //机器信息
    choosedFunctionName: {
      type: String,
      value: ''
    }, //出水口
    isBleUnlock: {
      type: Boolean,
      value: false
    }, //是否蓝牙解锁
  },
  attached() {},

  detached() {},
  methods: {
    //重新解锁
    retry() {
      log
        .push({
          type: 'unlock_btn_click',
        })
        .done();
      this.triggerEvent('handletap', null);
    },
  },
});