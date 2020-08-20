const app = getApp();
const {
  TimeUnit
} = app.globalData.utils.Mapping;

Component({
  mixins: [],
  data: {
    timeUnit: null,
    oneTime: null,
    twoTime: null,
    threeTime: null,
  },
  properties: {
    powerList: {
      type: Array,
      value: []
    },
    timeunit: {
      type: String,
      value: ''
    },
    timevalue: {
      type: String,
      value: ''
    },
    onFinish: {
      type: Function,
      value: data => {}
    },
  },
  attached() {
    this.setData({
      timeUnit: TimeUnit[this.data.timeunit],
      oneTime: parseFloat(
        this.data.timevalue * this.data.powerList[0].ratio
      ).toFixed(1),
      twoTime: parseFloat(
        this.data.timevalue * this.data.powerList[1].ratio
      ).toFixed(1),
      threeTime: parseFloat(
        this.data.timevalue * this.data.powerList[2].ratio
      ).toFixed(1),
    });
  },
  detached() {},
  methods: {
    closePop() {
      this.setData({
        isOpenDialog: false,
      });
      this.triggerEvent('finish', null);
    },
  },
});