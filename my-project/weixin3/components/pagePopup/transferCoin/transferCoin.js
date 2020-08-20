const app = getApp();

Component({
  mixins: [],
  data: {
    showTransferCoin: true,
    totalBanlance: 0, //总余额
    changeCoin: 0, //转换金币数量
  },
  lock: false,

  properties: {
    imei: {
      type: String,
      value: ''
    },
    shopName: {
      type: String,
      value: ''
    },
    balanceData: {
      type: String,
      value: ''
    },
    onFinish: {
      type: Function,
      value: (data) => {}
    },
  },
  attached() {
    let res = this.data.balanceData;
    if (res) {
      let total = parseFloat(res.balance + res.withholdAmount)
      let coin = total * 100;
      this.setData({
        totalBanlance: parseFloat(total).toFixed(2),
        changeCoin: parseFloat(coin).toFixed(0)
      })
    }
  },

  detached() {},
  methods: {
    //余额转金币
    handleTransferCoin() {
      if (this.lock) return;
      this.lock = true;
      if (this.data.imei) {
        app.$post('zhong_ka/transfer/coin', {
          machineId: this.data.imei
        }).then(res => {
          this.lock = false;
          if (res) {
            this.setData({
              showTransferCoin: false
            })
            wx.showModal({
              showCancel: false,
              title: '转换成功',
              content: '可通过企鹅小程序-我的-我的钱包-金币查看转换的金币',
              confirmText: '我知道了',
              success: () => {}
            });
          }
          this.triggerEvent('finish', this.data.showTransferCoin);
        }).catch(e => {
          this.lock = false;
        })
      }
    },
    //再想想
    closeOpen() {
      this.setData({
        showTransferCoin: false
      })
      this.triggerEvent('finish', this.data.showTransferCoin);
    },
  },
});