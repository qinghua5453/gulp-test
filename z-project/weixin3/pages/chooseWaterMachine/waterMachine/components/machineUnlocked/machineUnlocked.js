const app = getApp();
const {
  MachineAfterPay,
  _machineAfterPay
} = app.globalData;
const {
  Http
} = app.globalData.utils;
const {
  E_STATUS_CHANGED,
  STATUS_FINISHED
} = MachineAfterPay;
const {
  to
} = app.globalData.utils.core;
let timer;
Component({
  properties: {
    choosedFunctionName: {
      type: String,
      value: ''
    }, //选中的机器名
    unlockedId: {
      type: String,
      value: ''
    },
    machineId: {
      type: String,
      value: ''
    },
  },
  attached() {
    wx.setNavigationBarTitle({
      title: '解锁成功'
    });
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    wx.closeBluetoothAdapter();
    this.waterSync(this.data.unlockedId);
  },
  detached() {
    this.clearTimer();
    app.globalData._machineAfterPay = null;
  },
  methods: {
    //轮询机器出水状态
    waterSync(id) {
      this.checkChannelStatus(id)
        .then((res) => {
          if (!res) {
            timer = setTimeout((_) => {
              this.waterSync(id);
            }, 1000);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    },

    clearTimer() {
      if (timer) clearTimeout(timer);
      timer = null;
    },

    async checkChannelStatus(id) {
      let res = await Http.$post('machine/water/sync', {
        machineFunctionId: id,
      });
      if (res && res.status) {
        switch (res.status) {
          case 1:
          case 2:
          case 4:
            // 等待解锁
            // 正在出水 -> 结束接水页面
            // 解锁成功，等待出水 -> 解锁成功页面
            return;
          case 3:
          case 5:
            // 完成，释放口和机器
            if (_machineAfterPay && _machineAfterPay.eventBus) {
              _machineAfterPay.eventBus.emit(E_STATUS_CHANGED, STATUS_FINISHED);
            }
            if (res.amount * 1 > 0 && res.identify) {
              this.handleStop(res.identify);
            } else {
              this.handleReLaunch();
            }
            console.log('finish');

            return true;
          case 6:
            // 故障，返回首页
            this.handleReLaunch();
            return true;
        }
      }
      return;
    },
    // 结束事件，生成订单
    async handleStop(identify) {
      // 生成订单 -> 订单生成页面
      console.log('handle stop, create order', identify);
      to(`/pay/afterPay/addOrder/addOrder?id=${identify}`, null, 'redirect');
      if (_machineAfterPay) {
        _machineAfterPay.destroy();
        app.globalData._machineAfterPay = null;
      }
    },

    /**
     * 结束事件，回首页
     */
    async handleReLaunch() {
      to(`/pages/home/home`, null, 'reLaunch');
    },
  },
});