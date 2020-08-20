const app = getApp();
Component({
  mixins: [],
  data: {
    platform: 'ios', //手机系统
    titlePhone: '如何开启蓝牙？',
  },
  properties: {
    onFinish: {
      type: Function,
      value: data => {}
    },
  },
  attached() {
    let platform =
      app.globalData.systemInfo.platform === 'iOS' ? 'ios' : 'android';
    this.setData({
      platform,
    });
  },

  detached() {},
  methods: {
    //关闭弹窗
    closeBluetoothMode() {
      this.triggerEvent('finish', {
        status: false
      });
    },
  },
});