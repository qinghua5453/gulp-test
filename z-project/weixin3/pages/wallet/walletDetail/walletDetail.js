const app = getApp();
const {
  Direction,
  MachineType
} = app.globalData.utils.Mapping;
Page({
  data: {
    walletDetail: [],
    orderstatus: '',
    machineType: null,
    tokenCoinNumber: 0,
  },
  onLoad(res) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    let that = this;
    let type = res.type;
    if (type && type == 1) {
      app.$post('user/astrict/serial/detail', {
        id: res.id
      }).then(e => {
        let _orderstatus = Direction[e.direction];
        e.discountPrice = Number(e.discountPrice);
        that.setData({
          walletDetail: e,
          machineType: MachineType[e.parentTypeId],
          orderStatus: _orderstatus,
        });
        if (e.tokenCoinDiscount) {
          let number = e.tokenCoinDiscount * 100;
          that.setData({
            tokenCoinNumber: parseFloat(number).toFixed(0),
          });
        }
      });
    } else {
      app.$post('user/wallet/detail', {
        walletId: res.id
      }).then(e => {
        let _orderstatus = Direction[e.direction];
        e.discountPrice = Number(e.discountPrice);
        that.setData({
          walletDetail: e,
          machineType: MachineType[e.parentTypeId],
          orderStatus: _orderstatus,
        });
        if (e.tokenCoinDiscount) {
          let number = e.tokenCoinDiscount * 100;
          that.setData({
            tokenCoinNumber: parseFloat(number).toFixed(0),
          });
        }
      });
    }
  },
});