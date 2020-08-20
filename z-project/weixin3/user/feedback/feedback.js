const app = getApp();
Page({
  data: {
    isFeedBackShow: false,
    type: null, //反馈类型选中的type
    feedBackTitle: null, //反馈类型选中的内容
    contentTrue: false, //判断内容是否校验成功
    isActive: false,
    focus: false,
    textLength: 0, // 字数长度
    userContent: null,
    feedBackTypes: [{
        id: 0,
        type: 1,
        title: '功能意见',
      },
      {
        id: 1,
        type: 2,
        title: '页面意见',
      },
      {
        id: 2,
        type: 3,
        title: '操作意见',
      },
      {
        id: 3,
        type: 4,
        title: '新需求建议',
      },
      {
        id: 4,
        type: 5,
        title: '其他',
      },
    ],
  },
  onLoad() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    });
  },
  //显示意见反馈
  letFeedBackShow() {
    this.setData({
      isFeedBackShow: true,
    });
  },
  //选择反馈类型
  chooseFeedBackType(e) {
    let that = this;
    that.setData({
      type: e.currentTarget.dataset.type,
      isFeedBackShow: false,
      feedBackTitle: e.currentTarget.dataset.title,
    });
  },
  //判断按钮是否可点击
  descInput(e) {
    let _contentTrue = /\S/.test(e.detail.value);
    this.setData({
      contentTrue: _contentTrue,
      textLength: e.detail.value.length,
      userContent: e.detail.value,
    });
  },
  saveFeedback(e) {
    let that = this;
    if (!this.data.contentTrue || !this.data.type) {
      return false;
    }
    app
      .$post(
        'feedback/commit', {
          type: that.data.type,
          content: that.data.userContent,
        },
        true
      )
      .then(res => {
        wx.showModal({
          showCancel: false,
          title: '提交成功',
          content: '感谢您的反馈',
          confirmText: '知道了',
          success: () => {
            wx.navigateBack();
          },
        });
      });
  },

  //获取焦点时
  isActiveShow() {
    this.setData({
      isActive: true,
      focus: true,
    });
  },
  finished() {
    this.setData({
      isActive: false,
    });
  },
});