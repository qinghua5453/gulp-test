const app = getApp();
const Cache = app.globalData.Cache;
const CACHE_NOTICE = 'CACHE_NOTICE';
Component({
  mixins: [],
  data: {
    noticeShow: false,
  },
  properties: {},
  async attached() {
    let NoticeType = (await Cache.get(CACHE_NOTICE)) || null;
    if (NoticeType != 1) {
      this.setData({
        noticeShow: true,
      });
    } else {
      this.setData({
        noticeShow: false,
      });
    }
  },

  detached() {},
  methods: {
    closeNotice() {
      this.setData({
        noticeShow: false,
      });
      Cache.set(CACHE_NOTICE, 1);
    },
  },
});