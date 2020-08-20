Component({
  data: {},
  properties: {
    walletitem: {
      type: Object,
      value: {}
    },
    currentTab: {
      type: Number,
      value: 0
    },
    type: {
      type: Number,
      value: 1
    },
  },
  attached() {},

  detached() {},
  methods: {
    // 点击跳转
    goWalletDetail() {
      let id =
        this.data.type == 1 ?
        this.data.walletitem.walletId :
        this.data.walletitem.id;
      wx.navigateTo({
        url: `/pages/wallet/walletDetail/walletDetail?id=${id}&type=${this.data.currentTab}`,
      });
    },
  },
});