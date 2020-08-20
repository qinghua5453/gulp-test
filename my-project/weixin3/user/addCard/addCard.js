const app = getApp();
Page({
  data: {
    cardNumber: null,
  },

  goscan() {
    this.scanQr();
  },

  scanQr() {
    let that = this;
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success(res) {
        let data = res.result;
        if (data) {
          let numarr = [];
          for (var i = 0; i < data.length; i++) {
            let numflag = '';
            if (i % 2 == 0) {
              numflag = data[i] + data[i + 1];
              numarr.push(numflag);
            }
          }
          numarr = numarr.reverse().join('');
          that.setData({
            cardNumber: numarr,
          });
          wx.showModal({
            title: '绑定卡片',
            content: '已识别您的卡片' + data,
            confirmText: '绑定',
            cancelText: '暂不',
            success: result => {
              if (result.confirm) {
                that.handleCardBind();
              }
            },
          });
        } else {
          wx.showToast({
            icon: 'none',
            title: '二维码有误，换一个试试',
          });
        }
      },
      fail(e) {
        wx.showToast({
          icon: 'none',
          title: '扫码失败，请重试',
        });
      },
    });
  },

  async handleCardBind() {
    let res = await app.$post('water/card/bind', {
      cardNo: this.data.cardNumber,
    });
    if (res) {
      wx.showModal({
        showCancel: false,
        content: '添加成功',
        confirmText: '知道了',
        success: () => {
          wx.navigateBack({
            delta: 2,
          });
        },
      });
    }
  },
});