const app = getApp();
const {
  core
} = app.globalData.utils;
Page({
  data: {
    time: 0,
  },
  onShow() {
    this.setData({
      time: 0,
    });
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
        if (res.result.search('NQT') === -1) {
          wx.showToast({
            icon: 'none',
            title: '二维码有误，换一个试试',
          });
          return;
        }
        let nqt = core.getQueryString(res.code, 'NQT');
        if (!nqt) {
          wx.showToast({
            icon: 'none',
            title: '二维码有误，换一个试试',
          });
        } else {
          app
            .$post('water/card/start_bind', {
              NQT: nqt,
            })
            .then(res => {
              if (res) {
                that.getCardNo();
              }
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

  getCardNo() {
    if (this.data.time > 15) {
      wx.showModal({
        showCancel: false,
        content: '未识别到卡片',
        confirmText: '知道了',
        success: () => {
          this.setData({
            time: 0,
          });
        },
      });
      return;
    }
    app.$post('water/card/get_card').then(res => {
      if (res.ok) {
        if (res.cardNo) {
          let numarr = [];
          for (var i = 0; i < res.cardNo.length; i++) {
            let numflag = '';
            if (i % 2 == 0) {
              numflag = res.cardNo[i] + res.cardNo[i + 1];
              numarr.push(numflag);
            }
          }
          numarr = numarr.reverse().join('');
          wx.showModal({
            title: '绑定卡片',
            content: '已识别您的卡片' + numarr,
            confirmText: '绑定',
            cancelText: '暂不',
            success: result => {
              if (result.confirm) {
                this.waterCardBind(res.cardNo);
              }
            },
          });
          return;
        }
        return;
      } else {
        setTimeout(() => {
          this.data.time++;
          this.getCardNo();
        }, 1000);
      }
    });
  },

  waterCardBind(cardNo) {
    app.$post('water/card/bind', {
      cardNo
    }).then(res => {
      if (res) {
        wx.showModal({
          showCancel: false,
          content: '添加成功',
          confirmText: '知道了',
          success: () => {
            wx.navigateBack({
              delta: 1,
            });
          },
        });
      }
    });
  },

  goOtherAddCard() {
    wx.navigateTo({
      url: `/user/addCard/addCard`,
    });
  },
});