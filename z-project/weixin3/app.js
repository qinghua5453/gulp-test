import 'umtrack-wx';
import queryString from 'query-string';
import moment from 'moment';
import EventEmitter from 'eventemitter3';
import Config from '/models/config';
import User from '/models/user';
import ZKMachineAfterPay from '/models/zkMachineAfterPay';
import MachinePrePay from '/models/MachinePrePay';
import MachineAfterPay from '/models/machineAfterPay';
import Machine from '/models/machine';
import Order from '/models/order';
import Http from '/utils/Http';
import Cache from '/models/Cache';
import HttpErrorHandler from '/utils/HttpErrorHandler';
import * as Mapping from '/utils/Mapping';
import log from '/utils/log';
import core from '/utils/core';
import Bluetooth from '/models/bluetooth';

const UMT_APP_KEY = '5f1ab53ab4fa6023ce199b9a';

App({
  globalData: {
    currentVersion: '3.5.31',
    currCenterX: 0,
    currCenterY: 0,
    isScanBack: false,
    qrCode: null,
    nowTime: null,
    isShowNotice: null,
    voucherUserUsageVos: [],
    allActivationAssetDiscounts: null,
    couponActivationAssetId: null,
    choosetime: null,
    timeunit: null,
    selData: null,
    couponId: null, //优惠券相关
    nouseCoupon: null, //优惠券相关
    vipUrl: null,
    unimktList: [],
    eventBus: new EventEmitter(),
    Bluetooth,
    // 系统基本信息
    systemInfo: {},
    imgUrl: 'https://static.qiekj.com/',
    // 环境配置
    config: Config.get(),
    User,
    Cache,
    Machine,
    MachinePrePay,
    ZKMachineAfterPay,
    Order,
    MachineAfterPay,
    // 全局工具类，方便后续page,components 调用
    utils: {
      moment,
      core,
      queryString,
      Http,
      HttpErrorHandler,
      Mapping,
      log,
    },
    machine: null,
    _machineAfterPay: null,
    isIphonex: false, //是否是iphone系列手机
  },
  $post: Http.$post,
  $get: Http.$get,

  umengConfig: {
    appKey: UMT_APP_KEY,
    useOpenid: true,
    autoGetOpenid: true,
    debug: true,
  },

  async onLaunch(options) {
    // todo 优化
    if (options.query && options.query.qrCode) {
      this.globalData.qrCode = options.query.qrCode;
    }

    // 注册HTTP错误处理器
    this.addHttpErrorHandler();
    // 获取服务器时间差
    this.getDuration();
    // 初始化配置

    // 判断系统是否升级。0为正常，1弹出升级公告，2为系统正在升级，强制调整升级页面
    this.globalData.isShowNotice = await Http.fetch(
      this.globalData.config.INIT_URL
    );
    // 更新代码
    this.aliPayUpdateManager();

    if (this.globalData.isShowNotice === 2) {
      wx.navigateTo({
        url: '/pages/error/error',
      });
      return;
    }

    // 获取系统基本信息
    wx.getSystemInfo({
      success: res => {
        this.globalData.systemInfo = res;
        if (res.statusBarHeight === 44) {
          this.globalData.isIphonex = true;
        } else {
          this.globalData.isIphonex = false;
        }

        log.setConfig({
          brand: res.brand,
          model: res.model,
          system: res.system,
          version: res.version,
          platform: res.platform,
          env: this.globalData.config.env,
          currentVersion: this.globalData.currentVersion,
        });
      },
    });
  },

  onShow() {},

  onHide() {},

  getDuration() {
    // 获取服务器的时间
    this.globalData.nowTime = 40;
  },

  /**
   * 注册业务上需要使用的错误处理
   */
  addHttpErrorHandler() {
    // 注册默认错误事件
    HttpErrorHandler.addDefault(data => {
      let msg =
        data && data.code === 4105 ? '设备被预约，请更换设备使用' : null;
      let route = core.getCurrentPage();
      if (
        data &&
        data.code === 4054 &&
        route === 'pages/pay/payPreview/payPreview'
      ) {
        wx.showModal({
          showCancel: false,
          title: '提示',
          content: '无法使用洗衣液服务，试试取消选择洗衣液后重新提交',
          confirmText: '确定',
        });
        return;
      }
      wx.showModal({
        showCancel: false,
        title: '提示',
        content: msg || (data && data.msg ? data.msg : '调用API失败'),
        confirmText: '确定',
      });
    });

    // 注册特殊报错提示（Mapping.ErrorMessage）
    for (let code in Mapping.ErrorMessage) {
      HttpErrorHandler.add(code, () => {
        return wx.showToast({
          icon: 'none',
          title: Mapping.ErrorMessage[code],
          duration: 3000,
        });
      });
    }

    HttpErrorHandler.add(9004, () => {
      wx.showModal({
        showCancel: false,
        title: '提示',
        content: '限时特惠与会员优惠无法同时使用请重新选择优惠',
        confirmText: '确定',
      });
    });
    // 订单不存在
    HttpErrorHandler.add(3003, () => {
      return wx.navigateBack();
    });

    // 注册未登录错误
    HttpErrorHandler.add(2, async () => {
      // await User.logout();
      await User.removeToken();
      core.to('/pages/oneLogin/oneLogin');
    });

    // 注册未支付订单错误处理
    HttpErrorHandler.add(2128, data => {
      if (data.data && data.data.incompleteOrderId) {
        core.to(
          `/pay/afterPay/paymentOrder/paymentOrder?id=${data.data.incompleteOrderId}`,
          null,
          'redirect'
        );
      }
    });

    // 注册VIP开通店铺VIP卡不存在回退
    HttpErrorHandler.add(5003, data => {
      return wx.showModal({
        showCancel: false,
        title: '提示',
        content: data.msg,
        confirmText: '确定',
        success: () => {
          wx.navigateBack();
        },
      });
    });

    // 邀友VIP开通店铺VIP卡不存在回退
    HttpErrorHandler.add(5000, data => {
      return wx.showModal({
        showCancel: false,
        title: '提示',
        content: data.msg,
        confirmText: '确定',
        success: () => {
          wx.navigateBack();
        },
      });
    });
  },

  // 管理小程序包更新逻辑
  aliPayUpdateManager() {
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(function(res) {
      // 请求完新版本信息的回调
      console.log(res.hasUpdate);
    });

    updateManager.onUpdateReady(function() {
      // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
      updateManager.applyUpdate();
    });

    updateManager.onUpdateFailed(function() {
      // 新版本下载失败
    });
  },
});