Component({
  properties: {
    className: {
      type: String,
      value: ''
    },
    show: {
      type: Boolean,
      value: false
    },
    position: {
      type: String,
      value: 'bottom'
    },
    mask: {
      type: Boolean,
      value: true
    },
    zIndex: {
      type: Number,
      value: 999
    },
    animation: {
      type: Boolean,
      value: true
    },
    disableScroll: {
      type: Boolean,
      value: true
    },
  },
  methods: {
    onMaskTap: function onMaskTap() {
      this.triggerEvent("close");
    }
  },
});