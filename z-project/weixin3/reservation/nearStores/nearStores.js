const app = getApp();
const {
  WASH,
  DRY,
  TAKE_SHOWER,
  HAIR_DRY,
  CHARGING,
  DRINKING,
} = app.globalData.utils.Mapping;

let callout = {
  content: '',
  color: '#666666',
  fontSize: 14,
  borderRadius: 15,
  bgColor: '#fff',
  padding: 5,
  display: 'BYCLICK',
  textAlign: 'center'
}

const width = 37;
const height = 37;
const activeWidth = 45;
const activeHeight = 45;
const markerIconPath = 'https://static.qiekj.com/alipay/map-2-3x-a.png'; // 非联营iconPath
const attributeMarkerIconPath = 'https://static.qiekj.com/alipay/map-1-3x-a.png'; // 联营iconPath

Page({
  data: {
    scale: 17, // 放大缩小倍数 此参数影响是否markers能成功
    // longitude: 120.104338,
    // latitude: 30.272235,
    longitude: null, // 经度 x
    latitude: null, // 纬度 y
    nearAddress: true, // 初始化附近门店flag
    largerHeight: false,
    markers: [],
    // 预约相关变量
    reservelists: [],
    reservelistsLen: null,
    apiReserveFlag: false,
    currentTab: WASH.type,
    allLoaded: false,
    nearby: [WASH, DRY,  HAIR_DRY, CHARGING, DRINKING],
    activeArray: [], // 点击marker后底部附近门店
  },
  // 预约相关变量
  totalPage: 0,
  page: 1,
  reserve: 0,
  activeItem: '', // 点击marker后底部附近门店item

  onLoad(options) {
    if (app.globalData.currCenterX && app.globalData.currCenterY) {
      this.setData({
        longitude: app.globalData.currCenterX,
        latitude: app.globalData.currCenterY,
      });
      setTimeout(() => {
        this.getNearShop();
      }, 0);
    } else {
      wx.authorize({
        scope: 'scope.userLocation',
        success: () => {
          this.getUserCurrentLocation();
        }
      });
    }
  },

  onShow() {},

  onReady(e) {
    // 使用 wx.createMapContext 获取 map 上下文
    this.mapCtx = wx.createMapContext('map');
  },

  onReachBottom() {
    this.page = this.page + 1;
    if (this.page * 1 <= this.totalPage) {
      this.getNearShop();
    }
  },

  chooseTab(e) {
    let [type, currentTab] = [e.detail.type, this.data.currentTab];
    if (currentTab === type) {
      return false;
    } else {
      this.page = 1;
      this.setData({
        reservelists: [],
        allLoaded: false,
        currentTab: type,
        apiReserveFlag: false,
        reservelistsLen: null,
      });
      this.getCenterLocation();
    }
  },

  getUserCurrentLocation() {
    wx.getLocation({
      type: 'wgs84',
      success: res => {
        let [_latitude, _longitude] = [res.latitude, res.longitude];
        app.globalData.currCenterX = _longitude;
        app.globalData.currCenterY = _latitude;
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude,
        });
        setTimeout(() => {
          this.getNearShop();
        }, 0);
      },
      fail(e) {
        console.log(e);
      },
    });
  },

  async getNearShop() {
    let url =
      this.data.currentTab === TAKE_SHOWER.type ?
      'position/shower/list' :
      'shop/nearby/list';
    let res = await app.$post(url, {
      longitude: this.data.longitude,
      latitude: this.data.latitude,
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
    this.renderMarker(shopList);
    this.setData({
      reservelistsLen: shopList.length,
      apiReserveFlag: true,
      reservelists: shopList,
    });
  },

  renderMarker(shopList) {
    this.setData({
      markers: [],
    });
    shopList.forEach((el, index) => {
      let marker = {
        width,
        height,
        callout
      };
      marker.id = index;
      if (this.data.currentTab == TAKE_SHOWER.type) {
        // shower
        marker.longitude = el.lng;
        marker.latitude = el.lat;
      } else {
        marker.longitude = el.longitude;
        marker.latitude = el.latitude;
      }
      // 联营 还是非联营店铺
      el.attribute == 1 ?
        (marker.iconPath = attributeMarkerIconPath) :
        (marker.iconPath = markerIconPath);
      this.data.markers.push(marker);
    });
    this.setData({
      markers: this.data.markers,
    });
  },

  // 获取当前地图中心位置
  getCenterLocation() {
    let self = this;
    this.mapCtx.getCenterLocation({
      success: res => {
        self.setData({
          longitude: res.longitude,
          latitude: res.latitude,
        });
        setTimeout(() => {
          self.getNearShop();
        }, 0);
      },
    });
  },

  onMarkerTap(e) {
    let self = this;
    this.setData({
      nearAddress: false,
      largerHeight: true,
    });
    let markerId = e.markerId;
    // 点击markers的索引index
    let index = self.data.markers.findIndex(val => {
      return val.id == markerId;
    });
    this.activeItem = self.data.reservelists[index];
    this.setData({
      activeArray: [this.activeItem],
    });
    
     /*
      * 更改了宽高后 点击marker的callout 无法显示
      * 点击marker后 在开发者工具无法显示callout
     */

    // self.data.markers.forEach((element, index) => {
    //   if (element.width == width) return;
    //   if (element.width == activeWidth) {
    //     //  上一个被点击放大的icon 要恢复到初始大小
    //     let _width = 'markers[' + index + '].width';
    //     let _height = 'markers[' + index + '].height';
    //     this.setData({
    //       [_width]: width,
    //       [_height]: height,
    //     });
    //   }
    // });

    // let _width = 'markers[' + index + '].width';
    // let _height = 'markers[' + index + '].height';

    let distance =
      this.activeItem.distance > 1000 ?
      (this.activeItem.distance / 1000).toFixed(2) + 'km' :
      this.activeItem.distance.toFixed(1) + 'm';
    let _callout = 'markers[' + index + '].callout';

    this.setData({
      [_callout]: {
        content: '预计'+distance+' | 导航 >',
        color: callout.color,
        fontSize: callout.fontSize,
        borderRadius: callout.borderRadius,
        bgColor: callout.bgColor, 
        padding: callout.padding,
        display: callout.display,
        textAlign: callout.textAlign
      },
      // [_width]: activeWidth,
      // [_height]: activeHeight,
    })
    // console.log('this.data.markers[index]', this.data.markers[index])
  },

  // 查看更多门店
  moreStoresHandle() {
    this.setData({
      nearAddress: true,
      largerHeight: false,
      scale: 17,
    });
  },

  onCalloutTap(e) {
    let name =
      this.data.currentTab == TAKE_SHOWER.type ?
      this.activeItem.positionName :
      this.activeItem.name;
    let address = this.activeItem.address;
    wx.openLocation({
      longitude: this.data.longitude,
      latitude: this.data.latitude,
      name: name,
      address: address,
    });
  },

  regionchange(e) {
    if (e.type === 'end' && e.causedBy === 'drag') {
      this.setData({
        reservelists: [],
        allLoaded: false,
      });
      // reset page
      this.page = 1;
      this.totalPage = 0;
      this.getCenterLocation();
    }
  },
});