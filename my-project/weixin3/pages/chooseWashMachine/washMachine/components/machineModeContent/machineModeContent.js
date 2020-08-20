const app = getApp();
const {
  eventBus
} = app.globalData;
Component({
  data: {
    skus: null,
    currentSkuId: null,
    currentSku: null,
  },
  properties: {
    shop: {
      type: Object,
      value: {}
    },
    idx: {
      type: String,
      value: ''
    },
    list: {
      type: Array,
      value: [{
        type: Object,
        value: {}
      }]
    },
    machineId: {
      type: String,
      value: ''
    },
    machineType: {
      type: Number,
      value: 0
    },
    timeMarketDiscount: {
      type: Number,
      value: 0
    },
    vipDiscount: {
      type: Number,
      value: 0
    },
  },
  attached() {
    let machine_item = this.data.list.find((item) => {
      return item.id === this.data.idx;
    });
    eventBus.on('refreshSKUprice', () => {
      this.triggerEvent('getchoosetotalprice', {
        currSku: this.data.currentSku
      });
    });
    this.initSku(machine_item);
  },
  detached() {
    eventBus.removeAllListeners('refreshSKUprice');
  },
  methods: {
    initSku(machine_item) {
      let skus = null;
      if (machine_item.sku && machine_item.sku.skus) {
        skus = machine_item.sku.skus;
        this.selectMaxPrice(skus);
      } else {
        eventBus.emit('refreshSKUprice');
      }
    },
    handleSelect(e) {
      let machine_item = e.currentTarget.dataset.item;
      if (machine_item.id === this.data.idx) {
        return;
      }
      eventBus.emit('userCouponShowPrice');
      let numINDEX = e.currentTarget.dataset.index;
      let machineId = this.data.list[numINDEX].id;
      this.triggerEvent('handleselect', {
        numINDEX,
        machine_item,
        machineId
      });
      this.initSku(machine_item);
    },
    selectMaxPrice(skus) {
      let newArr = [];
      skus.forEach((item) => {
        newArr.push(parseFloat(item.price));
      });
      let max = Math.max(...newArr);
      let index = newArr.indexOf(max),
        currentSku = skus[index];
      currentSku.isSel = true;
      this.setData({
        skus,
        currentSkuId: currentSku.skuId,
        currentSku,
      });
      eventBus.emit('refreshSKUprice');
    },
    selectDetergent(e) {
      let index = e.currentTarget.dataset.index,
        newArr = [...this.data.skus],
        currentSku = newArr[index],
        currentSkuId = currentSku.skuId;
      newArr.forEach((item) => {
        if (item.skuId !== currentSku.skuId) {
          item.isSel = false;
        } else {
          item.isSel = !item.isSel;
        }
      });
      if (!currentSku.isSel) {
        currentSku = null;
      }
      this.setData({
        skus: newArr,
        currentSkuId,
        currentSku,
      });
      eventBus.emit('refreshSKUprice');
    },
  },
});