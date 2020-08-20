Component({
  properties: {
    statusText: {
      type: String,
      value: '连接超时了'
    },
    title: {
      type: String,
      value: ''
    },
  },
  attached() {
    wx.setNavigationBarTitle({
      title: this.data.title
    });
    wx.setNavigationBarColor({
      backgroundColor: '#FFFFFF',
      frontColor: '#000000'
    });
  },
  detached() {},
  methods: {
    retry() {
      this.triggerEvent('retry', null);
    },
  },
});