Component({
  mixins: [],
  data: {
    scrollLeft: 0,
  },
  properties: {
    currentTab: {
      type: String,
      value: ''
    },
    nearby: {
      type: Array,
      value: []
    },
    onChooseTab: {
      type: Function,
      value: data => {}
    },
  },
  attached() {},

  detached() {},
  methods: {
    chooseTab(e) {
      let {
        type,
        index
      } = e.currentTarget.dataset;
      if (index >= 4) {
        this.setData({
          scrollLeft: 29,
        });
      } else {
        this.setData({
          scrollLeft: 0,
        });
      }
      this.triggerEvent('choosetab', {
        type
      });
    },
  },
});