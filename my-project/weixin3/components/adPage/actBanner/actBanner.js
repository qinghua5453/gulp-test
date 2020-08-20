const app = getApp();
const {
  queryString
} = app.globalData.utils;
const {
  Cache
} = app.globalData;

Component({
  mixins: [],

  machineId: null,
  shopId: null,
  data: {
    bannerList: [],
    bannerStyle: '',
    swiperCurrent: 0,
    showType: 1,
    isShowPopup: true,
  },
  properties: {
    adKey: {
      type: String,
      value: ''
    },
    machineId: {
      type: String,
      value: ''
    },
    actType: {
      type: String,
      value: 'banner'
    },
    isReloadAd: {
      type: Boolean,
      value: false
    },
    onBannerList: {
      type: Function,
      value: data => {}
    },
  },
  attached() {
    this.updateAd();
  },
  observers: {
    'isReloadAd': function(isReloadAd) {
      if (isReloadAd) {
        this.updateAd();
      }
    },
  },

  detached() {},
  methods: {
    async updateAd() {
      try {
        this.machineId = await Cache.get('machineId');
        this.shopId = await Cache.get('shopId');
        this.getActInfo();
      } catch (_) {
        this.getActInfo();
      }
    },
    getActInfo() {
      app
        .$get('slot/get', {
          slotKey: 'wx_' + this.data.adKey,
          machineId: this.machineId,
          shopId: this.shopId,
        })
        .then(res => {
          if (res) {
            this.triggerEvent('bannerlist', {
              bannerList: res && res.images.length ? res.images : [],
              adKey: this.data.adKey,
            });
            let adBannerList = res.images;
            if (adBannerList && adBannerList.length > 0) {
              wx.uma.trackEvent(this.data.adKey, {
                type: 'exposure'
              });
              let imageSize = res.imageSize; //图片大小
              let imgWidth = imageSize.split('*')[0] || 0;
              let imghHeight = imageSize.split('*')[1] || 0;
              let bannerStyle =
                'width:' + imgWidth + 'rpx;' + 'height:' + imghHeight + 'rpx;';
              this.setData({
                showType: res.showType,
                bannerList: adBannerList,
                bannerStyle,
              });
            }
          }
        }).catch(err => {
          this.triggerEvent('bannerlist', {
            bannerList: [],
            adKey: this.data.adKey,
          });
        })
    },

    async goActivity(e) {
      let index = e.currentTarget.dataset.index;
      let bannerItem = this.data.bannerList[index];
      //统计
      wx.uma.trackEvent(this.data.adKey, {
        type: 'click',
        imageUrl: bannerItem.imageUrl,
      });
      await this.setBannerInfo(bannerItem);
    },

    /**
     * 轮播滑动事件
     */
    swiperChange(e) {
      this.setData({
        swiperCurrent: e.detail.current,
      });
    },

    /**
     * 轮播广告详情
     */
    async goBannerDetail(e) {
      //wx.uma.trackEvent(this.data.adKey, { type: 'click' });
      let index = e.currentTarget.dataset.index;
      let item = this.data.bannerList[index];
      //统计
      wx.uma.trackEvent(this.data.adKey, {
        type: 'click',
        imageUrl: item.imageUrl,
      });
      await this.setBannerInfo(item);
    },

    async setBannerInfo(item) {
      if (item.linkType * 1 === 2) {
        let str = item.linkUrl.split('?')[0];
        if (str.search('alipays') === -1) {
          wx.navigateTo({
            url: item.linkUrl,
          });
          return;
        } else {
          let url = item.linkUrl.slice(item.linkUrl.indexOf('?') + 1);
          url = url.replace(/\?/g, '&');
          let obj = queryString.parse(url);
          let app_Id = obj.appId;
          let ad_page = obj.page;
          let extraData = Object.assign({}, obj);
          delete extraData.appId;
          delete extraData.page;
          wx.navigateToMiniProgram({
            appId: app_Id,
            path: ad_page,
            extraData: extraData,
          });
        }
      } else if (item.linkType * 1 === 3) {
        wx.ap.navigateToAlipayPage({
          path: item.linkUrl,
        });
      } else if (item.linkType * 1 === 1) {
        let _url = encodeURIComponent(item.linkUrl);
        wx.navigateTo({
          url: `/pages/adWebview/adWebview?linkUrl=${_url}`,
        });
      }
    },

    //关闭其他页面弹窗
    closePop() {
      this.setData({
        isShowPopup: false,
      });
    },
  },
});