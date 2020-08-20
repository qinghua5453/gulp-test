Page({
  data: {
    isBle: false,
    openBluetoothShow: false,
    statusText: '连接超时了',
    title: null,
    hasPhone: false,
    phoneText: null,
  },

  onLoad(options) {
    let {
      hasPhone,
      phoneText,
      isBle
    } = options;
    this.setData({
      hasPhone,
      phoneText,
      isBle: isBle === 'false' ? false : true,
    });
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    });
    wx.closeBluetoothAdapter();
  },
  makeCall() {
    let phonenumber = this.data.phoneText;
    wx.makePhoneCall({
      phoneNumber: phonenumber
    });
  },
  retry() {
    wx.navigateBack();
  },
  useBlueTooth(e) {
    this.setData({
      openBluetoothShow: true,
    });
  },
  closeBluetoothShow(e) {
    this.setData({
      openBluetoothShow: e.detail.status,
    });
  },
});