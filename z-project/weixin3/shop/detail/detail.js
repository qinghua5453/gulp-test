const app = getApp();
const {
  WASH,
  DRY,
  TAKE_SHOWER,
  HAIR_DRY,
  CHARGING,
  DRINKING,
  SHOE,
  MASSAGE,
} = app.globalData.utils.Mapping;
const {
  User
} = app.globalData;

Page({
  data: {
    shop: null,
    tipList: [], //营销tip
    navActiveIndex: 0,
    headerNavs: ['店铺VIP会员', '通用小票'],
    reserveLists: [],
    reserveListsLen: null,
    reserveListsApiFlag: false,
    shopId: null,
    machineType: null,
    positionId: null,
  },

  onLoad(options) {
    console.log('options', options);
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    this.setData({
      shopId: options.shopId,
      machineType: options.type,
      positionId: options.positionId,
    });
  },

  async onShow() {
    await User.fetchUserData();
    this.getShopOutline();
  },

  changeNav(e) {
    // console.log('e', e)
    let {
      index
    } = e.target.dataset;
    this.setData({
      navActiveIndex: index,
    });
  },

  async getShopOutline() {
    let url =
      this.data.machineType == TAKE_SHOWER.type ?
      'position/shower/detail' :
      'shop/outline';
    let data = {};
    if (this.data.machineType == TAKE_SHOWER.type) {
      // shower
      data = {
        positionId: this.data.positionId,
        longitude: app.globalData.currCenterX,
        latitude: app.globalData.currCenterY,
        userId: User.getUid() || '',
      };
    } else {
      data = {
        shopId: this.data.shopId,
        // machineId: '',
        longitude: app.globalData.currCenterX,
        latitude: app.globalData.currCenterY,
      };
    }
    let res = await app.$post(url, data);
    this.setData({
      shop: res || null,
    });
    if (res.shopState != 2) return;
    this.getPromotionCenterTip();
    this.getMachineReserveList();
  },

  // 可预约list
  async getMachineReserveList() {
    let payload = {};
    if (this.data.machineType == TAKE_SHOWER.type) {
      // shower
      payload = {
        shopId: this.data.shopId,
        positionId: this.data.positionId,
      };
    } else {
      payload = {
        shopId: this.data.shopId,
        longitude: app.globalData.currCenterX,
        latitude: app.globalData.currCenterY,
      };
    }
    let url =
      this.data.machineType == TAKE_SHOWER.type ?
      `shower/goods/nearByList` :
      'machineModel/nearByList';
    let res = await app.$post(url, payload);

    let _list = res.items;
    // 淋浴
    if (this.data.machineType == TAKE_SHOWER.type) {
      // shower
      res[0].bgColor = '#187DFF';
      res[0].imageUrl = 'https://static.qiekj.com/linyu-3x.png';
      this.renderIsShowReserve(res);
    } else {
      _list.map(item => {
        // default
        item.bgColor = '#187DFF';
        item.boxShadow = '0px 4px 8px 0px rgba(24,125,255,0.3)';
        item.imageUrl = 'https://static.qiekj.com/xiyiji-3x.png';
        if (item.machineTypeId == DRY.id) {
          //  烘干机
          item.bgColor = '#FF8B36';
          item.boxShadow = '0px 4px 8px 0px rgba(255,139,54,0.3)';
          item.imageUrl = 'https://static.qiekj.com/hongganji-3x-y.png';
        } else if (item.machineTypeId == WASH.id) {
          item.imageUrl = 'https://static.qiekj.com/xiyiji-3x.png';
        } else if (item.machineTypeId == TAKE_SHOWER.id) {
          item.imageUrl = 'https://static.qiekj.com/linyu-3x.png';
        } else if (item.machineTypeId == HAIR_DRY.id) {
          item.imageUrl = 'https://static.qiekj.com/chuifenji-3x.png';
        } else if (item.machineTypeId == CHARGING.id) {
          item.imageUrl = 'https://static.qiekj.com/chongdian-3x.png';
        } else if (item.machineTypeId == DRINKING.id) {
          item.imageUrl = 'https://static.qiekj.com/yinshuiji-3x.png';
        } else if (item.machineTypeId == SHOE.id) {
          item.imageUrl = 'https://static.qiekj.com/xixieji-3x.png';
        } else if (item.machineTypeId == MASSAGE.id) {
          // 按摩椅
          item.imageUrl = 'https://static.qiekj.com/anmoyi-3x.png';
        }
      });
      this.renderIsShowReserve(_list);
    }
  },

  renderIsShowReserve(list) {
    list.map(item => {
      // default 不可预约
      item.isReserve = 1;
      this.data.shop.typeList.map(parentTypeId => {
        if (parentTypeId == item.parentTypeId) {
          item.isReserve = 0; // 可预约的
        }
      });
    });
    this.setData({
      reserveListsLen: list.length,
      reserveListsApiFlag: true,
      reserveLists: list,
    });
  },

  goToReserve() {
    let url = `/reservation/detail/detail?shopId=${this.data.shopId}&type=${this.machineType}`;
    wx.navigateTo({
      url: url,
    });
  },

  async getPromotionCenterTip() {
    let res = await app.$post('promotionCenter/ownedByUser', {
      shopId: this.data.shopId,
    });
    res.sort((a, b) => {
      // 按照 res 里具体的某一项：promotionType 升序排列
      let val1 = a['promotionType'];
      let val2 = b['promotionType'];
      return val1 - val2;
    });
    this.setData({
      tipList: res,
    });
  },

  // vip 购买跳转
  goToPurchase() {
    let url = '';
    if (this.data.tipList.length == 1) {
      let item = this.data.tipList[0];
      if (item.promotionType == 1) {
        // vip
        url = `/pages/vip/createVip/createVip?shopId=${this.data.shopId}`;
      } else if (item.promotionType == 4) {
        // 小票
        url = `/user/recharge/buyGold/buyGold?shopId=${this.data.shopId}`;
      }
    } else if (this.data.tipList.length == 2) {
      if (this.data.navActiveIndex == 0) {
        // vip
        url = `/pages/vip/createVip/createVip?shopId=${this.data.shopId}`;
      } else if (this.data.navActiveIndex == 1) {
        // 小票
        url = `/user/recharge/buyGold/buyGold?shopId=${this.data.shopId}`;
      }
    }
    wx.navigateTo({
      url: url,
    });
  },

  handleReser(e) {
    let index = e.currentTarget.dataset.index;
    let _list = this.data.list[index];
    wx.navigateTo({
      url: `/reservation/chooseMachine/chooseMachine?machineTypeId=${_list.machineTypeId}&shopId=${this.data.shop.shopId}&type=${this.type}`,
    });
  },
});