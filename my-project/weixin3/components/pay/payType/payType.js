const app = getApp();
/**支付方式 */
const PAYTYPE = {
  ALIPAY: 'ALIPAY',
  BALANCE: 'BALANCE',
};

Component({
  mixins: [],
  userBalance: 0, //用户正常余额
  userAstrictBalance: 0, //用户受限余额
  data: {
    isShowBalance: false,
    isSupport: true,
    totalBalance: 0,
    type: 1,
    balanceShow: false,
  },
  properties: {
    onPayType: {
      type: Function,
      value: data => {}
    },
    onBalancePaySuccess: {
      type: Function,
      value: data => {}
    },
    onCloseBalancePay: {
      type: Function,
      value: data => {}
    },
    orderDetail: {
      type: Object,
      value: {}
    },
    balancePayShow: {
      type: Boolean,
      value: false
    },
  },
  observers: {
    'balancePayShow': function(balancePayShow) {
      this.setData({
        balanceShow: balancePayShow,
      });
    },
  },
  attached() {
    this.getUserBalance();
  },

  detached() {},
  methods: {
    /**支付方式 */
    selectPayType(e) {
      let type = Number(e.currentTarget.dataset.item);
      if (type === 2) {
        if (!this.data.isSupport) {
          return;
        }
      }
      this.setData({
        type
      });
      let payType = type === 1 ? PAYTYPE.ALIPAY : PAYTYPE.BALANCE;
      this.triggerEvent('paytype', {
        payType
      });
    },

    /**用户正常余额 */
    async getUserBalance() {
      let res = await app.$post('user/info');
      this.userBalance = Number(res.balance);
      await this.getUserAstrictBalance();
    },

    /**用户受限余额 */
    async getUserAstrictBalance() {
      let [orderId, payPrice] = [
        this.data.orderDetail.id,
        Number(this.data.orderDetail.payPrice),
      ];
      let res = await app.$post('user/astrict/residue', {
        orderId
      });
      if (res && res.remainCoin) {
        this.userAstrictBalance = Number(res.remainCoin);
      }

      //余额支付按钮是否展示
      let _totalBalance =
        Number(this.userBalance) + Number(this.userAstrictBalance);
      this.setData({
        totalBalance: _totalBalance.toFixed(2),
      });
      if (payPrice <= 0 && _totalBalance <= 0) {
        this.setData({
          isShowBalance: false
        });
      } else {
        this.setData({
          isShowBalance: true
        });
        if (this.userBalance >= payPrice) {
          this.setData({
            isSupport: true,
          });
        } else if (this.userAstrictBalance >= payPrice) {
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

    /**余额支付 */
    async balancePay() {
      let [orderId] = [this.data.orderDetail.id];
      let balanceData = await app.$post('pay/preBalance', {
        orderId
      });
      let balanceType = balanceData && balanceData.type ? balanceData.type : 1;
      let url = balanceType == 1 ? 'pay/withBalance' : 'pay/astrictBalance';
      await app.$post(url, {
        orderId
      });
      this.triggerEvent('balancepaysuccess', null);
    },

    /**关闭余额支付弹窗 */
    balancePayClose() {
      this.triggerEvent('closebalancepay', null);
    },
  },
});