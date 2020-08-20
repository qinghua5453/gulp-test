Page({
  machineFunctionId: null,
  orderId: null,
  skuIds: null,
  isDisabled: false,
  appointOrderId: null,
  onLoad(opitons) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#2766E7'
    });
    this.machineFunctionId = opitons.machineFunctionId;
    this.appointOrderId = opitons.appointOrderId;
    this.orderId = opitons.orderId;
    if (opitons.skuIds) {
      this.skuIds = opitons.skuIds;
    }
  },
  closeTheDoor() {
    if (this.isDisabled) {
      return;
    } else {
      this.isDisabled = true;
      if (this.appointOrderId) {
        let url = `/pay/payment/paySuccess/paySuccess?orderId=${this.orderId}`;
        wx.redirectTo({
          url,
          success: () => {
            this.isDisabled = false;
          },
        });
        return;
      }
      let url = `/pages/pay/payPreview/payPreview?machineFunctionId=${this.machineFunctionId}`;
      if (this.skuIds) {
        url = url + `&skuIds=${this.skuIds}`;
      }
      wx.redirectTo({
        url,
        success: () => {
          this.isDisabled = false;
        },
      });
    }
  },
});