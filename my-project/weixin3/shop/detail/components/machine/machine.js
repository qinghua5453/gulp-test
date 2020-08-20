const app = getApp();
Component({
  mixins: [],
  data: {},
  properties: {
    reserveLists: {
      type: Array,
      value: []
    },
    shop: {
      type: Object,
      value: {}
    },
    shopId: {
      type: String,
      value: ''
    },
    machineType: {
      type: String,
      value: ''
    },
    positionId: {
      type: String,
      value: ''
    }, // 淋浴
  },
  attached() {},

  detached() {},
  methods: {
    goToReserve(e) {
      let [type] = [e.currentTarget.dataset.type]
      let url = `/reservation/detail/detail?shopId=${this.data.shopId}&type=${type}`;
      wx.navigateTo({
        url: url,
      });
    },

    async goToReserveShower() {
      let positionName = this.data.shop ? this.data.shop.positionName : '';
      let [positionId, orgId, sexAllow] = [this.data.positionId, this.data.shop.orgId, this.data.shop.sexAllow];
      let showerPopup = await app.$post('shower/password/shouldPopup'); //是否显示淋浴密码
      if (
        sexAllow !== 2 &&
        sexAllow !== showerPopup.gender
      ) {
        wx.showToast({
          icon: 'none',
          title: '不可预约与性别不符的浴室',
          duration: 1000,
        });
        return;
      }
      if (showerPopup.shouldPopup) {
        wx.navigateTo({
          url: `/shower/showerPassword/showerPassword?positionId=${positionId}&parentOrgId=${orgId}&positionName=${positionName}`,
        });
        return;
      }
      wx.navigateTo({
        url: `/shower/showerMachine/showerMachine?positionId=${positionId}&parentOrgId=${orgId}&positionName=${positionName}`,
      });
    },
  },
});