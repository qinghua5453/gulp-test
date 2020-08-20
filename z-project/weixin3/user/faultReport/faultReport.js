const app = getApp();

Page({
  machineId: null,
  type: null,

  data: {
    malfunctionList: [{
        type: 1,
        name: '设备报修'
      },
      {
        type: 2,
        name: '软件故障'
      },
      {
        type: 3,
        name: '卫生状况'
      },
      {
        type: 4,
        name: '计费错误'
      },
      {
        type: 5,
        name: '水电问题'
      },
      {
        type: 0,
        name: '其他'
      },
    ],
    currentTab: 0,
    reportContent: '', //上报内容
    isChooseType: false,
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    let item = this.data.malfunctionList[this.data.currentTab];
    this.machineId = options.machineId;
    this.type = item.type;
  },

  chooseType(e) {
    let index = e.currentTarget.dataset.index;
    let item = this.data.malfunctionList[index];
    this.type = item.type;
    this.setData({
      currentTab: index,
    });
  },

  descInput(e) {
    let flag = /\S/.test(e.detail.value);
    this.setData({
      reportContent: e.detail.value,
      isChooseType: flag,
    });
  },

  async reportFailure() {
    this.setData({
      isChooseType: false,
    });
    app
      .$post('failure/report', {
        description: this.data.reportContent,
        machineId: this.machineId,
        type: this.type,
      })
      .then(res => {
        if (res) {
          wx.showModal({
            showCancel: false,
            title: '提交成功',
            content: '感觉您的反馈',
            confirmText: '知道了',
            success: () => {
              wx.navigateBack({
                delta: 1,
              });
            },
          });
        } else {
          this.setData({
            isChooseType: true,
          });
        }
      })
      .catch(() => {
        this.setData({
          isChooseType: true,
        });
      });
  },
});