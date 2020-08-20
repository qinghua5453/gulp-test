Component({
  data: {},
  properties: {
    operatorPhone: {
      type: String,
      value: ''
    },
    machineId: {
      type: String,
      value: ''
    },
  },
  attached() {},

  detached() {},
  methods: {
    openCustomerService() {
      wx.navigateToMiniProgram({
        appId: '2019080166077530',
      });
    },

    openReport() {
      wx.navigateTo({
        url: `/user/faultReport/faultReport?machineId=${this.data.machineId}`,
      });
    },

    callMerchant() {
      wx.showModal({
        title: '商家联系电话',
        content: this.data.operatorPhone,
        confirmText: '立即呼叫',
        cancelText: '取消',
        success: result => {
          if (result.confirm) {
            wx.makePhoneCall({
              phoneNumber: this.data.operatorPhone,
            });
          }
        },
      });
    },
  },
});