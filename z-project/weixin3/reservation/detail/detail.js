const app = getApp();
const {
  ShopMachineType,
  ShopState
} = app.globalData.utils.Mapping;

Page({
  orgId: null,
  type: null,
  machineType: null,
  shopId: null,

  data: {
    type: null,
    list: [],
    listLen: null,
    listSuccessFlag: false,
    tipList: [], //营销tip
    shopState: null,
    isCollected: false, //该店铺是否被收藏
  },

  onLoad(options) {
    console.log('options', options);
    this.machineType = options.type;
    this.shopId = options.shopId;
    this.setData({
      type: options.type,
    });
    this.getMachineList();
  },

  onShow() {},

  async getShopOutline() {
    let payload = {
      shopId: this.shopId,
      longitude: app.globalData.currCenterX,
      latitude: app.globalData.currCenterY,
      reserve: 0,
    };
    let res = await app.$post('shop/outline', payload);
    this.orgId = res.id;
    let typeList = res.typeList;
    this.type = this.machineType ?
      this.machineType :
      typeList && typeList.length > 0 ?
      typeList[0] :
      '';
    if (typeList && typeList.length > 0) {
      let _index = typeList.findIndex(item => item === this.type * 1);
      this.setData({
        currentTab: _index,
      });
      res.typeList = res.typeList.map(item => {
        let data = {
          type: item,
          name: ShopMachineType[item],
        };
        return data;
      });
    }
    wx.setNavigationBarTitle({
      title: res && res.brandName ? res.brandName : '店铺详情'
    });
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    });
    this.setData({
      shop: res,
      isCollected: res.collected === 0 ? false : true,
      shopState: ShopState[res.shopState],
    });
    await this.getMachineList();
  },

  async getPromotionCenterTip() {
    let res = await app.$post('promotionCenter/ownedByUser', {
      shopId: this.shopId,
    });
    this.setData({
      tipList: res,
    });
  },

  async getMachineList() {
    let _list = this.data.list;
    let url = 'machineModel/list';
    let basicPayload = {
      shopId: this.shopId,
      longitude: app.globalData.currCenterX,
      latitude: app.globalData.currCenterY,
      type: this.machineType,
    };
    let res = await app.$post(url, basicPayload);
    let arr = res.items || [];
    _list = [..._list, ...arr];
    this.setData({
      listLen: _list.length,
      listSuccessFlag: true,
      list: _list,
    });
  },

  handleReser(e) {
    let index = e.currentTarget.dataset.index;
    let _list = this.data.list[index];
    wx.navigateTo({
      url: `/reservation/chooseMachine/chooseMachine?machineTypeId=${_list.machineTypeId}&shopId=${this.shopId}&type=${this.machineType}`,
    });
  },
});