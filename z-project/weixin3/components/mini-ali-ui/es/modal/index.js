Component({
  data: {},
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    mask: {
      type: Boolean,
      value: true
    },
    disableScroll: {
      type: Boolean,
      value: true
    },
    buttonComfirmText: {
      type: String,
      value: '确定'
    },
    buttonCancelText: {
      type: String,
      value: '取消'
    },
    showButtonComfirm: {
      type: Boolean,
      value: true
    },
    showButtonCancel: {
      type: Boolean,
      value: false
    },
  },
  attached() {},
  methods: {
    // mask 遮罩层点击
    _onMaskTap() {
      if (this.data.onMaskClick) {
        this.triggerEvent('maskclick', null);
      }
    },

    _onButtonClickComfirm() {
      this.triggerEvent('buttonclickcomfirm', null);
    },

    _onButtonClickCancel() {
      this.triggerEvent('buttonclickcancel', null);
    },
  },
});