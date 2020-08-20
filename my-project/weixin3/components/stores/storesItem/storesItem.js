const app = getApp();
const {
  TAKE_SHOWER
} = app.globalData.utils.Mapping;

Component({
  mixins: [],
  data: {},
  properties: {
    currentTab: {
      type: String,
      value: ''
    },
    item: {
      type: Object,
      value: {}
    },
  },
  async attached() {},

  detached() {},
  methods: {
    goDetail() {
      let [_item, type] = [this.data.item, this.data.currentTab];
      let shopId = type == TAKE_SHOWER.type ? _item.shopId : _item.id;
      let url =
        type == TAKE_SHOWER.type ?
        `/shop/detail/detail?shopId=${shopId}&type=${type}&positionId=${_item.positionId}` :
        `/shop/detail/detail?shopId=${shopId}&type=${type}`;
      wx.navigateTo({
        url: url,
      });
    },

    goToReserve() {
      let [_item, type] = [this.data.item, this.data.currentTab];
      if (type != 10) {
        let shopId = type == TAKE_SHOWER.type ? _item.shopId : _item.id;
        let url = `/reservation/detail/detail?shopId=${shopId}&type=${type}`;
        wx.navigateTo({
          url: url,
        });
      } else if (type == 10) {
        // 淋浴
        this.goToReserveShower(_item);
      }
    },

    async goToReserveShower(_item) {
      let positionName = _item.positionName ? _item.positionName : '';
      let [positionId, orgId, sexAllow] = [
        _item.positionId,
        _item.orgId,
        _item.sexAllow,
      ];
      let showerPopup = await app.$post('shower/password/shouldPopup'); //是否显示淋浴密码
      if (sexAllow !== 2 && sexAllow !== showerPopup.gender) {
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