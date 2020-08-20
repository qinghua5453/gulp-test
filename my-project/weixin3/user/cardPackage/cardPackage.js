const app = getApp();
Page({
  data: {
    cardList: null,
    editCardName: null,
    isEditCardName: false,
    cardId: null,
    cardIndex: 0,
    isFreeSecret: true, //是否开通免密
    isOpenFree: true,
  },
  lock: false,
  onShow() {
    this.showSignAlert();
    this.getCardList();
  },

  showSignAlert() {
    app.$post('alipay/isSign').then(res => {
      this.setData({
        isFreeSecret: res,
      });
    });
  },

  handleEditCardName(e) {
    let index = e.currentTarget.dataset.index;
    let id = this.data.cardList[index].id;
    let name = this.data.cardList[index].name;
    this.setData({
      isEditCardName: true,
      cardId: id,
      editCardName: name,
      cardIndex: index,
    });
  },

  bindEdit(e) {
    this.setData({
      editCardName: e.detail.value,
    });
  },

  UdpateUserName() {
    // eslint-disable-next-line no-useless-escape
    let reg = /[^\a-\z\A-\Z0-9\u4E00-\u9FA5]/g; //卡名称验证
    if (this.data.editCardName.trim().length < 2) {
      wx.showToast({
        icon: 'none',
        title: '名称2-10个字符，只支持中英文、数字',
        duration: 1000,
      });
      return;
    }
    if (reg.test(this.data.editCardName.trim())) {
      wx.showToast({
        icon: 'none',
        title: '名称2-10个字符，只支持中英文、数字',
        duration: 1000,
      });
      return;
    }
    app
      .$post('water/card/name', {
        id: this.data.cardId,
        name: this.data.editCardName,
      })
      .then(res => {
        if (res) {
          let newCardList = this.data.cardList;
          newCardList[this.data.cardIndex].name = this.data.editCardName;
          this.setData({
            cardList: newCardList,
            isEditCardName: false,
          });
        }
      });
  },

  closeEditUserName() {
    this.setData({
      isEditCardName: false,
    });
  },

  getCardList() {
    app.$post('water/card/list').then(res => {
      let arr = res || [];
      arr.forEach((i, v) => {
        let _name = '企鹅卡' + parseInt(v + 1);
        i.cardNo = this.changeCardNo(i.cardNo);
        i.name = i.name ? i.name : _name;
      });
      this.setData({
        cardList: arr,
      });
    });
  },

  changeCardNo(cardNo) {
    let numarr = [];
    if (cardNo) {
      for (var i = 0; i < cardNo.length; i++) {
        let numflag = '';
        if (i % 2 == 0) {
          numflag = cardNo[i] + cardNo[i + 1];
          numarr.push(numflag);
        }
      }
      numarr = numarr.reverse().join('');
    }
    return numarr;
  },

  //添加卡
  async addCard() {
    if (this.lock) return;
    this.lock = true;
    if (this.data.isFreeSecret) {
      this.setData({
        isOpenFree: true,
      });
      wx.navigateTo({
        url: `/user/newCardBind/newCardBind`,
        success: () => {
          this.lock = false;
        },
      });
    } else {
      this.lock = false;
      this.setData({
        isOpenFree: false,
      });
    }
  },
  //解除绑定
  handleUnbind(e) {
    let index = e.currentTarget.dataset.index;
    let item = this.data.cardList[index];
    let id = item.id;
    wx.showModal({
      title: '删除卡片',
      content: '您确定要删除卡片么？',
      confirmText: '是的',
      cancelText: '暂不',
      success: result => {
        if (result.confirm) {
          this.unbind(id, index);
        }
      },
    });
  },
  unbind(id, index) {
    app
      .$post('water/card/unbind', {
        id: id,
      })
      .then(res => {
        let array = this.data.cardList;
        array.splice(index, 1);
        this.setData({
          cardList: array,
        });
      });
  },
});