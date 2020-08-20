Component({
  mixins: [],
  data: {
    showReserTime: false,
    machineTimeData: {
      dayList: [],
      hourList: [],
      minuteList: [],
      days: [], // ['06月01日 今天', '06月02日 明天', '06月03日 后天']
      chooseDay: null, // 今天 明天 后天
      chooseDate: null, // 6月3日 18点10分
      chooseHourMinute: null,
    },
    pickerValue: [0, 0, 0], // default 三列的第一项
  },

  properties: {
    isShowReserTime: {
      type: Boolean,
      value: false
    },
    appointmentData: {
      type: Object,
      value: {
        dayList: {
          type: Array,
          value: []
        },
        hourList: {
          type: Array,
          value: []
        },
        minuteList: {
          type: Array,
          value: []
        },
        chooseDay: {
          type: String,
          value: ''
        }, // 今天 明天 后天
        chooseDate: {
          type: String,
          value: ''
        }, // 6月3日 18点10分
        chooseHourMinute: {
          type: String,
          value: ''
        },
      }
    },
    onHandleConfirmTime: {
      type: Function,
      value: data => {}
    },
  },

  observers: {
    // console.log('nextProps', nextProps)
    'isShowReserTime': function(isShowReserTime) {
      this.setData({
        showReserTime: isShowReserTime,
      });
    },
    'appointmentData': function(appointmentData) {
      this.setData({
        machineTimeData: appointmentData,
      });
    },
  },

  attached() {
    // console.log('attached', this.props)
    this.setData({
      machineTimeData: this.data.appointmentData,
      showReserTime: this.data.isShowReserTime,
    });
  },
  didUpdate() {
    // console.log('machineTimeData-didUpdate', this.data.machineTimeData);
  },
  detached() {},
  methods: {
    pickerOnChange(e) {
      let {
        value
      } = e.detail;
      this.setData({
        pickerValue: value,
      });
      // 更新时间 小时
      let activeHourArr = this.data.machineTimeData.dayList.filter(
        (item, index) => {
          return index == value[0];
        }
      );
      this.setData({
        'machineTimeData.hourList': activeHourArr[0].hourList,
      });
      // 更新时间 分钟
      let activeMinArr = this.data.machineTimeData.hourList.filter(
        (item, index) => {
          return index == value[1];
        }
      );
      if (activeMinArr.length) {
        this.setData({
          'machineTimeData.minuteList': activeMinArr[0].minuteList,
        });
      }
    },

    closeReserTime() {
      this.triggerEvent('closeresertime', null);
    },

    handleConfirmTime() {
      let value = this.data.pickerValue;
      // console.log('value', value);
      let dateArr = this.data.machineTimeData.dayList.filter((item, index) => {
        return index == value[0];
      });
      let hourArr = this.data.machineTimeData.hourList.filter((item, index) => {
        return index == value[1];
      });
      let minArr = this.data.machineTimeData.minuteList.filter(
        (item, index) => {
          return index == value[2];
        }
      );
      this.setData({
        'machineTimeData.chooseDay': dateArr[0].name
          .split('(')[1]
          .split(')')[0],
        'machineTimeData.chooseDate': dateArr[0].value.split('-')[1] +
          '月' +
          dateArr[0].value.split('-')[2] +
          '日',
        'machineTimeData.chooseHourMinute': hourArr[0].name + minArr[0].name,
      });

      let desc =
        dateArr[0].value +
        ' ' +
        hourArr[0].value +
        ':' +
        minArr[0].value +
        ':00';
      this.triggerEvent('handleconfirmtime', {
        desc,
        appointmentData: this.data.machineTimeData,
      });
    },
  },
});