const app = getApp();
const {
  core
} = app.globalData.utils;

Component({
  data: {
    str: '',
    timer: null, //定时器id
    hour: 0,
    minutes: 0,
  },
  properties: {
    type: {
      type: String,
      value: ''
    },
    time: {
      type: String,
      value: ''
    },
    onFinish: {
      type: Function,
      value: data => {}
    },
  },
  attached() {
    this.startCountDown(this.data.time);
  },
  didUpdate(prevProps, prevData) {
    if (prevProps.time !== this.data.time) {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.startCountDown(this.data.time);
    }
  },
  detached() {
    clearInterval(this.timer);
    this.timer = null;
  },
  methods: {
    // 开始倒计时
    startCountDown(countdown) {
      if (countdown === '') {
        this.timer && clearInterval(this.timer);
        return;
      }
      if (countdown <= 0) {
        this.triggerEvent('finish', {
          countdown
        });
        this.getStr(0);
        return false;
      }
      this.getStr(countdown);
      this.timer = setInterval(() => {
        countdown--;
        this.getStr(countdown);
        if (countdown <= 0) {
          this.triggerEvent('finish', {
            countdown
          });
          clearInterval(this.timer);
          this.timer = null;
          return;
        }
      }, 1000);
    },

    // 根据type类型，返回不同的时间格式 风格1：直接返回秒 风格2: 返回00:00:00格式
    getStr(countdown) {
      if (this.data.type == 1) {
        this.setData({
          str: countdown
        });
      } else if (this.data.type == 2) {
        this.setData({
          str: core.formatDuration(countdown)
        });
      } else if (this.data.type == 3 || this.data.type == 4) {
        let subTime = core.formatHourMinutes(countdown);
        let index = subTime.indexOf(':');
        if (index != -1) {
          let _hour = subTime.substring(0, index);
          let _minute = subTime.substring(index + 1, subTime.length);
          this.setData({
            hour: Number(_hour),
            minutes: Number(_minute),
          });
        }
      } else if (this.data.type == 5) {
        this.setData({
          str: core.formatMinutes(countdown)
        });
      }
    },
  },
});