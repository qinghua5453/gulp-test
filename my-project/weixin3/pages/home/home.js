const app = getApp();
const { Machine, User } = app.globalData;
const {
  WASH,
  DRY,
  TAKE_SHOWER,
  HAIR_DRY,
  CHARGING,
  DRINKING,
} = app.globalData.utils.Mapping;

Page({
  privateData: {},
  data: {
    // 预约相关变量
    reservelists: [],
    reservelistsLen: null,
    apiReserverListsFlag: false,
    washMachineLists: [],
    currentTab: WASH.type,
    allLoaded: false,
    nearby: [WASH, DRY, HAIR_DRY, CHARGING, DRINKING],
    adverReload: false,
    iconDingwei: '../../assets/images/home/location-3x.png',
    iconSaoyisao: '../../assets/images/home/scan-3x.png',
    pickUpbannerList1: [1],
    pickUpbannerList2: [1],
    seckillBannerList: [1],
  },
  // 预约相关变量
  currCenterX: null, // 经度
  currCenterY: null, // 纬度
  totalPage: 0,
  page: 1,
  reserve: 0,

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    });
    this.getUserCurrentLocation();
  },

  onShow() {},

  onPullDownRefresh() {
    wx.stopPullDownRefresh();
    this.reset();
  },

  onReachBottom() {
    this.page = this.page + 1;
    if (this.page * 1 <= this.totalPage) {
      this.getNearShop();
    }
  },

  reset() {
    this.page = 1;
    this.setData({
      reservelists: [],
      allLoaded: false,
      currentTab: WASH.type,
      reservelistsLen: null,
      apiReserverListsFlag: false,
      adverReload: true,
    });
    if (app.globalData.currCenterX && app.globalData.currCenterY) {
      this.currCenterX = app.globalData.currCenterX;
      this.currCenterY = app.globalData.currCenterY;
      this.getNearShop();
    } else {
      wx.authorize({
        scope: 'scope.userLocation',
        success: () => {
          this.getUserCurrentLocation();
        },
      });
    }
    setTimeout(() => {
      this.setData({
        adverReload: false,
      });
    }, 0);
  },

  goToMap() {
    wx.navigateTo({
      url: '/reservation/nearStores/nearStores',
    });
  },

  chooseTab(e) {
    let [type, currentTab] = [e.detail.type, this.data.currentTab];
    console.log('type', type);
    if (currentTab === type) {
      return false;
    } else {
      this.page = 1;
      this.setData({
        reservelists: [],
        allLoaded: false,
        currentTab: type,
        reservelistsLen: null,
        apiReserverListsFlag: false,
      });
      this.getNearShop();
    }
  },

  getUserCurrentLocation() {
    let self = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success(res) {
              self.wxGetLocation();
            },
            fail(err) {
              console.log('err', err);
              self.wxShowMoalOpenSetting();
            },
          });
        } else {
          self.wxGetLocation();
        }
      },
      fail(err) {
        console.log('err', err);
      },
    });
  },

  wxGetLocation() {
    let self = this;
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        let [_latitude, _longitude] = [res.latitude, res.longitude];
        self.currCenterX = _longitude;
        self.currCenterY = _latitude;
        app.globalData.currCenterX = _longitude;
        app.globalData.currCenterY = _latitude;
        self.getNearShop();
      },
      fail(err) {
        wx.showModal({
          title: '温馨提示',
          content: '授权失败,请重新授权~',
          showCancel: false,
          success(res) {
            if (res.confirm) {
              console.log('res', res);
              self.getUserCurrentLocation();
            }
          },
        });
      },
    });
  },

  wxOpenSetting() {
    let self = this;
    wx.openSetting({
      success(res) {
        console.log(res.authSetting);
        if (res.authSetting['scope.userLocation']) {
          self.wxGetLocation();
        } else {
          self.wxShowMoalOpenSetting();
        }
      },
    });
  },

  wxShowMoalOpenSetting() {
    let self = this;
    wx.showModal({
      title: '定位服务未开启',
      content: '企鹅共享知道您的位置才能提供更好的服务哦~',
      showCancel: false,
      success(res) {
        if (res.confirm) {
          console.log('res', res);
          self.wxOpenSetting();
        }
      },
    });
  },

  async getNearShop() {
    // console.log('this.data.currentTab', this.data.currentTab);
    let url =
      this.data.currentTab === TAKE_SHOWER.type
        ? 'position/shower/list'
        : 'shop/nearby/list';
    let res = await app.$post(url, {
      longitude: this.currCenterX,
      latitude: this.currCenterY,
      type: this.data.currentTab,
      // reserve: this.reserve,
      page: this.page,
      pageSize: 10,
    });
    let _totalPage = Math.ceil(res.total / 10);
    this.totalPage = _totalPage;
    if (this.page >= _totalPage) {
      this.setData({
        allLoaded: true,
      });
    } else {
      this.setData({
        allLoaded: false,
      });
    }
    let arr = res.items || [];
    let shopList = this.data.reservelists;
    shopList = [...shopList, ...arr];
    if (this.data.currentTab == 7) {
      // 洗衣机
      this.setData({
        washMachineLists: shopList,
      });
    }
    this.setData({
      reservelistsLen: shopList.length,
      reservelists: shopList,
      apiReserverListsFlag: true,
    });
  },

  async scan() {
    let token = await User.check();
    if (token) {
      let params = await this.scanQr();
      let res = await app.$post('machine/scan', params);
      this.getMachineById(res.machineId, res.shopCanReserve);
    }
  },

  // 扫一扫
  async scanQr() {
    return new Promise((resolve, reject) => {
      wx.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode'], // 	扫码样式 (默认 qr)：qr, 扫码框样式为二维码扫码框bar，扫码样式为条形码扫码框,
        success: (res) => {
          let str = res.result;
          let params = {};
          if (str.indexOf('http') === -1) {
            //中卡设备
            let data = app.globalData.utils.core.parseZhongkaMachine(str);
            params = {
              IMEI: data.id,
            };
            this.zkData = str;
          } else {
            let nqt = app.globalData.utils.core.getQueryString(str, 'NQT');
            params = {
              NQT: nqt,
            };
            if (!nqt) {
              setTimeout(() => {
                wx.showToast({
                  icon: 'none',
                  title: '二维码有误，换一个试试',
                });
              }, 30);
              reject();
            } else {
              if (nqt.length === 22) {
                wx.navigateTo({
                  url: `/pages/chooseShowerMachine/showerMachine/showerMachine?nqt=${nqt}`,
                });
                reject();
              }
            }
          }

          resolve(params);
        },
      });
    });
  },

  // 获取机器详情
  async getMachineById(machineId, shopCanReserve) {
    try {
      if (shopCanReserve) {
        let data = await app.$post(
          'appoint/canUseList',
          {
            machineId: machineId,
          },
          'POST',
          false
        );
        if (data && data.items.length > 0) {
          wx.navigateTo({
            url: `/pages/scanResult/scanResult?machineId=${machineId}`,
          });
          return;
        }
      }
      let data = await Machine.getDetail(machineId);

      if (data && data.detail.company === 'zhongka') {
        wx.navigateTo({
          url: `/pages/mediumCard/mediumCardMachine/mediumCardMachine?machineId=${machineId}&machineData=${this.zkData}`,
        });
        return;
      }
      let url = `/pages/chooseWashMachine/washMachine/washMachine?machineId=${machineId}`;
      switch (data.mode) {
        case 1:
          url = `/pages/chooseWaterMachine/waterMachine/waterMachine?machineId=${machineId}`;
          break;
        case 2:
          url = `/pages/chooseChargeMachine/chargeMachine/chargeMachine?machineId=${machineId}`;
          break;
      }
      wx.navigateTo({
        url,
      });
    } catch (err) {
      let { statusCode, content } = Machine.handleMachineError(err);
      if (statusCode) {
        this.setData({
          isMachineStatus: true,
          statusCode,
        });
      } else {
        if (content) {
          setTimeout(() => {
            wx.showToast({
              icon: 'none',
              title: content,
            });
          }, 30);
        }
      }
      Machine.resetData();
    }
  },

  chooseClassify(e) {
    let { index } = e.target.dataset;
    this.setData({
      classifyCurrentIndex: index,
    });
  },

  renderBannerList(e) {
    let { bannerList, adKey } = e.detail;
    if (adKey == 'ad_home_daily_discount_1') {
      this.setData({
        pickUpbannerList1: bannerList,
      });
    }
    if (adKey == 'ad_home_daily_discount_2') {
      this.setData({
        pickUpbannerList2: bannerList,
      });
    }
    if (adKey == 'ad_home_seckill') {
      this.setData({
        seckillBannerList: bannerList,
      });
    }
  },
});
