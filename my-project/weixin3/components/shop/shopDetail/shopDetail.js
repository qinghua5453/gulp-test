const app = getApp();
Component({
  mixins: [],
  // longitude: null,
  // latitude: null,
  data: {
    // shop: null,
  },
  properties: {
    shop: {
      type: Object,
      value: {}
    },
    machineId: {
      type: String,
      value: ''
    },
    machineType: {
      type: String,
      value: ''
    },
  },
  attached() {},

  detached() {},
  methods: {
    goToMap() {
      let name =
        this.data.machineType == 10 ?
        this.data.shop.positionName :
        this.data.shop.shopName;
      let address = this.data.shop.address;
      wx.openLocation({
        longitude: this.data.shop.lng,
        latitude: this.data.shop.lat,
        name: name,
        address: address,
      });
    },

    /**
     *
     * @param {*} latitude
     * @param {*} longitude
     */
    async getShopOutline(latitude, longitude) {
      let res = await app.$post('shop/outline', {
        shopId: this.data.shopId,
        machineId: this.data.machineId,
        longitude,
        latitude,
      });
      this.setData({
        shop: res || null,
      });
    },
  },
});