Component({
  data: {
    offset: '',
  },
  properties: {
    statusText: {
      type: String,
      value: ''
    },
    marginTop: {
      type: String,
      value: ''
    },
  },
  attached() {
    this.setData({
      offset: 'margin-top:' + this.data.marginTop + 'rpx',
    });
  },
});