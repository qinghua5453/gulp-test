Page({
  data: {
    phoneText: '4006689966',
    code: null,
  },
  onLoad(res) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.setData({
      code: res.code,
    });
  },
  makeCall() {
    let phonenumber = this.data.phoneText;
    wx.makePhoneCall({
      phoneNumber: phonenumber
    });
  },
});