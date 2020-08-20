Component({
  mixins: [],
  data: {},
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
      let [type] = [e.currentTarget.dataset.type];
      this.triggerEvent('choosetab', {
        type
      });
    },
  },
});