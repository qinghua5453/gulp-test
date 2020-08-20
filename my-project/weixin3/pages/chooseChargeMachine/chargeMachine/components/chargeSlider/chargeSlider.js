let totalWidth = 620,
  perWidth = null,
  paddingLeft = 56;
let min, max, step, totalCounts, halfStep;
let maxList = [];
Component({
  data: {
    curValue: null,
    maxList: null,
    offsetx: '',
  },
  properties: {
    min: {
      type: Number,
      value: 1
    },
    max: {
      type: Number,
      value: 10
    },
    step: {
      type: Number,
      value: 1
    },
    value: {
      type: Number,
      value: 4
    },
    valueUnit: {
      type: String,
      value: ''
    },
  },
  attached() {
    min = parseFloat(this.data.min);
    max = parseFloat(this.data.max);
    step = parseFloat(this.data.step);
    halfStep = step / 2;
    totalCounts = (max - min) / step;
    let curValue = parseFloat(this.data.value);
    perWidth = totalWidth / totalCounts;
    let offsetx = perWidth * ((curValue - min) / step);
    offsetx = 'transform:translateX(' + offsetx + 'rpx)';
    maxList = [];
    for (let i = min; i <= max; i = i + step) {
      maxList.push(i);
    }
    this.setData({
      maxList,
      curValue,
      offsetx,
    });
  },
  observers: {},
  detached() {},
  methods: {
    lineTap(e) {
      let index = e.currentTarget.dataset.index,
        offsetx = perWidth * index;
      offsetx = 'transform:translateX(' + offsetx + 'rpx)';
      let curValue = index * step + 1;
      this.setData({
        offsetx,
        curValue,
      });
      this.triggerEvent('change', {
        chargTime: curValue
      });
    },
    plus(e) {
      let curValue = this.data.curValue;
      if (curValue === parseInt(this.data.max)) {
        return;
      }
      curValue = curValue + step;
      let offsetx = this.calculate(curValue - min);
      this.setData({
        offsetx,
        curValue,
      });
      this.triggerEvent('change', {
        chargTime: curValue
      });
    },
    minus(e) {
      let curValue = this.data.curValue;
      if (curValue === parseInt(this.data.min)) {
        return;
      }
      curValue = curValue - step;
      let offsetx = this.calculate(curValue - min);
      this.setData({
        offsetx,
        curValue,
      });
      this.triggerEvent('change', {
        chargTime: curValue
      });
    },
    movePointer(e) {
      setTimeout(() => {
        let clientX = 2 * e.changedTouches[0].clientX;
        let initX = clientX - paddingLeft;
        let curValue;
        if (initX < 0) {
          initX = 0;
          curValue = min;
        } else if (initX > totalWidth) {
          initX = totalWidth;
          curValue = max;
        } else {
          curValue = (initX * step) / perWidth;
          curValue = this.fixOffeset(curValue);
          curValue = curValue + min;
        }
        let offsetx = 'transform:translateX(' + initX + 'rpx)';
        this.setData({
          offsetx,
          curValue,
        });
      }, 0);
    },
    fixOffeset(curValue) {
      let curValue2 = Math.floor(curValue),
        newValue;
      if (curValue - curValue2 >= step + halfStep) {
        newValue = curValue2 + 2 * step;
      } else if (
        curValue - curValue2 > step &&
        curValue - curValue2 < step + halfStep
      ) {
        newValue = curValue2 + step;
      } else if (
        curValue - curValue2 <= step &&
        curValue - curValue2 >= halfStep
      ) {
        newValue = curValue2 + step;
      } else if (curValue - curValue2 < halfStep) {
        newValue = curValue2;
      }
      return newValue;
    },
    calculate(curValue) {
      let initX = (curValue / step) * perWidth;
      let offsetx = 'transform:translateX(' + initX + 'rpx)';
      return offsetx;
    },
    touchPointerEnd(e) {
      setTimeout(() => {
        let clientX = 2 * e.changedTouches[0].clientX;
        let initX = clientX - paddingLeft;
        if (initX < 0) {
          initX = 0;
        } else if (initX > totalWidth) {
          initX = totalWidth;
        }
        let curValue = (initX * step) / perWidth;
        curValue = this.fixOffeset(curValue);
        let offsetx = this.calculate(curValue);
        this.setData({
          offsetx,
        });
        this.triggerEvent('change', {
          chargTime: this.data.curValue
        });
      }, 0);
    },
  },
});