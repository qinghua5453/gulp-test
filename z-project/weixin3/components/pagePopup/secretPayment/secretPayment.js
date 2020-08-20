const app = getApp();
Component({
  mixins: [],
  data: {
    isShowPop: true, //免密支付开通是否展示
  },
  properties: {
    onFinish: {
      type: Function,
      value: (data, type) => {}
    },
  },
  attached() {},

  detached() {},
  methods: {
    async openPayment() {
      let that = this;
      let res = await app.$post('alipay/signUrl');
      if (res) {
        let url = res.url;
        let str = encodeURIComponent(url.split('?')[1]);
        wx.paySignCenter({
          signStr: str,
          success: res => {
            if (res.resultStatus * 1 === 7000) {
              that.setData({
                isShowPop: false,
              });
            } else {
              that.setData({
                isShowPop: true,
              });
            }
            that.triggerEvent('finish', null);
          },
          fail: res => {
            that.setData({
              isShowPop: true,
            });
            that.triggerEvent('finish', null);
          },
        });
      }
    },
  },
});