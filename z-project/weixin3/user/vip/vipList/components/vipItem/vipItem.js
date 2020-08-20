Component({
  data: {
    isVipDetailShow: false,
  },
  properties: {
    vipitem: {
      type: Object,
      value: {}
    },
    type: {
      type: Number,
      value: 1
    },
    index: {
      type: Number,
      value: 0
    },
  },
  attached() {
    if (this.data.index === 0) {
      this.setData({
        isVipDetailShow: true,
      });
    }
  },

  detached() {},
  methods: {
    // 是否显示会员权益
    letDatedDetailShow() {
      this.setData({
        isVipDetailShow: !this.data.isVipDetailShow,
      });
    },
    // 点击跳转
    toCreateVip(e) {
      let shopId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/vip/createVip/createVip?shopId=${shopId}`,
      });
    },
  },
});