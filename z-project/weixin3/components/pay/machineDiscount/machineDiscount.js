const app = getApp();
const {
  MachineType
} = app.globalData.utils.Mapping;

Component({
  mixins: [],
  data: {
    parentTypeId: null,
    skus: null,
  },
  properties: {
    orderDetail: {
      type: Object,
      value: {}
    },
  },
  attached() {
    if (this.data.orderDetail) {
      let order = this.data.orderDetail;
      if (order && order.skus) {
        let skus = order.skus;
        let newArr = [];
        skus.forEach(sku => {
          if (sku.brandTypes === '1') {
            sku.washLiquidIcon = 'washLiquid';
          } else if (sku.brandTypes === '2') {
            sku.washLiquidIcon = 'cleargerm';
          } else if (sku.brandTypes.indexOf(',') !== -1) {
            sku.washLiquidIcon = 'mergeIcon';
          }
          newArr.push(sku);
        });
        skus = newArr;
        this.setData({
          skus: skus,
        });
      }
      this.setData({
        parentTypeId: MachineType[order.parentTypeId],
      });
    }
  },

  detached() {},
  methods: {},
});