Component({
  data: {
    openBluetoothShow: false,
  },
  properties: {
    statusText: {
      type: String,
      value: '连接超时了'
    },
    title: {
      type: String,
      value: ''
    },
    hasPhone: {
      type: Boolean,
      value: false
    },
    phoneText: {
      type: String,
      value: ''
    },
    isBle: {
      type: Boolean,
      value: false
    },
  },
  attached() {
    wx.setNavigationBarTitle({
      title: this.data.title
    });
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#FFFFFF'
    });
  },
  detached() {},
  methods: {
    makeCall() {
      let phonenumber = this.data.phoneText;
      wx.makePhoneCall({
        phoneNumber: phonenumber
      });
    },
    retry() {
      this.triggerEvent('retry', null);
    },
    useBlueTooth() {
      this.setData({
        openBluetoothShow: true,
      });
    },
    closeBluetoothShow(e) {
      this.setData({
        openBluetoothShow: e.detail.status,
      });
    },
  },
});