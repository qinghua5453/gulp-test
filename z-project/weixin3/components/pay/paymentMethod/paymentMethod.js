Component({
  mixins: [],
  userBalance: 0, //用户余额
  userAstrictBalance: 0, //用户受限余额
  data: {
    payType: 3, //支付方式 1 微信 2 余额
    itemWx: 3,
    isShowBalance: false, //是否展示余额支付
    isSupport: false, //是否支持余额支付
    price: 0,
  },
  properties: {
    payPrice: {
      type: Number,
      value: 0
    }, //支付金额
    balanceData: {
      type: Object,
      value: {}
    },
  },
  observers: {
    'payPrice': function(payPrice) {
      this.setData({
        price: payPrice,
      });
    },
  },
  attached() {
    this.setData({
      price: this.data.payPrice,
    });
    this.getUserBalance();
  },

  detached() {},
  methods: {
    /**用户正常余额 */
    async getUserBalance() {
      let balanceData = this.data.balanceData;
      let payPrice = Number(this.data.price);
      //余额支付按钮是否展示
      let _totalBalance =
        Number(balanceData.userBalance) +
        Number(balanceData.userAstrictBalance);
      if (payPrice <= 0 && _totalBalance <= 0) {
        this.setData({
          isShowBalance: false
        });
      } else {
        this.setData({
          isShowBalance: true
        });
        if (balanceData.userBalance >= payPrice) {
          this.setData({
            isSupport: true,
          });
        } else if (balanceData.userAstrictBalance >= payPrice) {
          this.setData({
            isSupport: true,
          });
        } else {
          this.setData({
            isSupport: false,
          });
        }
      }
    },

    /**选择支付方式 */
    selectPayType(e) {
      let type = Number(e.currentTarget.dataset.item);
      this.setData({
        payType: type
      });
      this.triggerEvent('setpaytype', {
        type
      });
    },
  },
});