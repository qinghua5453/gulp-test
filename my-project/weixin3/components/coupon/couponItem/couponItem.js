Component({
  data: {
    showMore: false,
  },
  properties: {
    couponitem: {
      type: Object,
      value: {}
    },
    ischoose: {
      type: Boolean,
      value: false
    },
    isAbate: {
      type: Boolean,
      value: false
    },
    couponId: {
      type: String,
      value: ''
    },
  },
  attached() {},

  detached() {},
  methods: {
    // 是否显示会员权益
    letShowMore() {
      this.setData({
        showMore: !this.data.showMore,
      });
    },
    // 选择点击跳转
    chooseCoupon() {
      if (this.data.ischoose) {
        let couponId = this.data.couponitem.id;
        this.triggerEvent('changecoupon', {
          couponId
        });
      }
    },
  },
});