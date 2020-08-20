const app = getApp();
const {
  Machine
} = app.globalData;
Component({
  properties: {
    statusCode: {
      type: String,
      value: ''
    },
    statusContent: {
      type: String,
      value: ''
    },
  },
  methods: {
    //回到首页
    goHome() {
      Machine.resetData();
      wx.reLaunch({
        url: '/pages/home/home',
      });
    },
  },
});