const app = getApp();
const Cache = app.globalData.Cache;
const CACHE_ACTIVITY = 'CACHE_ACTIVITY';
Component({
  mixins: [],
  data: {
    isShowReward: false,
    diffOrderNumber: 0, //还差单量
    remainFund: 0, //奖金变化
    timer: null,
    animationProgress: {}, //进度条动画
    runWidth: 100, //进度条宽度
    runLeft: 0, //进度条距离
    activityData: null,
    isShowDelete: true,
  },
  lock: false,
  properties: {
    actItem: {
      type: String,
      value: ''
    },
    onFinish: {
      type: Function,
      value: data => {}
    },
    isShowCash: {
      type: Boolean,
      value: true
    },
  },
  async attached() {
    let ends = (await Cache.get(CACHE_ACTIVITY)) || null;
    this.setData({
      activityData: ends,
    });
    if (this.data.actItem.active === 1 && this.data.actItem.state === 0) {
      let diff = parseInt(
        this.data.actItem.totalNum - this.data.actItem.completeNum
      );
      this.setData({
        diffOrderNumber: diff,
        remainFund: this.data.actItem.remainFund,
      });
      this.setProgress(100, 0, this.data.actItem.completeNum);
      this.popupSync();
    }
    let flag = this.isShowbtnDelete();
    this.setData({
      isShowDelete: flag,
    });
  },

  detached() {
    this.clearAllTimeout();
  },
  methods: {
    //领取现金任务
    handleActive() {
      if (this.lock) return;
      this.lock = true;
      app.$post('event/active').then(res => {
        if (res.state === 0) {
          this.lock = false;
          wx.showToast({
            icon: 'success',
            title: '参与成功',
          });

          this.triggerEvent('finish', false);
        }
      });
    },

    //弹框数据轮询
    popupSync() {
      app
        .$post(
          'popup/sync', {
            popupType: 3,
          },
          true
        )
        .then(res => {
          this.setRemainFund(res.remainFund).then(() => {
            this.popupSync();
          });
        });
    },

    //再来一单
    handleTryAgain() {

      this.clearAllTimeout();
      this.triggerEvent('finish', false);
    },

    //拆红包
    handleReceive() {
      if (this.lock) return;
      this.lock = true;
      app
        .$post('event/receive', {
          eventActiveId: this.data.actItem.eventActiveId,
        })
        .then(res => {
          if (res.state === 0) {
            this.lock = false;
            this.animationPopHide(this, 'animationReceive', 0);
            this.animationPopShow(this, 'animationEnvelop', 1);
            this.setData({
              isShowReward: true,
            });
          }
        });
    },

    //关闭活动
    handleEnds() {
      Cache.set(CACHE_ACTIVITY, 1);

      this.triggerEvent('finish', false);
    },

    //关闭弹窗
    handleClose() {
      this.clearAllTimeout();

      this.triggerEvent('finish', false);
    },

    //进度条动画
    setProgress(progressWidth, progressLeft, completeNum) {
      progressWidth = progressWidth - parseInt(completeNum * 10);
      progressLeft = progressLeft + parseInt(completeNum * 10);
      let animation = wx.createAnimation({
        duration: 1000,
        timingFunction: 'linear',
      });
      animation
        .left(progressLeft + '%')
        .width(progressWidth + '%')
        .step();
      this.setData({
        animationProgress: animation.export(),
      });
    },

    //奖金池数字变化
    setRemainFund(newNum) {
      let result = new Promise((resolve, reject) => {
        let countDown = () => {
          if (parseInt(this.data.remainFund, 10) === parseInt(newNum, 10)) {
            setTimeout(() => {
              resolve(true);
            }, 5000);

            return;
          }
          this.setData({
              remainFund: this.data.remainFund - 10,
            },
            () => {
              this.timer = setTimeout(
                countDown,
                Math.floor(Math.random() * (550 - 200 + 1) + 200)
              );
            }
          );
        };
        countDown();
      });

      return result;
    },

    //淡出动画
    animationPopHide(that, param, opacity) {
      var animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease-in',
      });
      animation.opacity(opacity).step();
      //将param转换为key
      var json = '{"' + param + '":""}';
      json = JSON.parse(json);
      json[param] = animation.export();
      //设置动画
      that.setData(json);
    },

    //渐入动画
    animationPopShow(that, param, opacity) {
      var animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease-in',
      });
      animation.opacity(opacity).step();
      //将param转换为key
      var json = '{"' + param + '":""}';
      json = JSON.parse(json);
      json[param] = animation.export();
      //设置动画
      that.setData(json);
    },

    //清除定时器
    clearAllTimeout() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    isShowbtnDelete() {
      let flag = true;
      if (this.data.actItem.active === 0) {
        flag = false;
      } else if (
        this.data.actItem.active === 1 &&
        this.data.actItem.eventState === 3 &&
        this.data.actItem.state === 0 &&
        this.data.activityData != 1
      ) {
        flag = false;
      } else {
        flag = true;
      }
      return flag;
    },
  },
});