const app = getApp();
Page({
  positionId: null,
  parentOrgId: null,
  positionName: null,
  data: {
    passwordData: {
      password: '',
      confirmPassword: '',
      gender: null,
    },
    useBtnShow: false,
    activePassword: false,
    activeConfirmPassword: false,
  },
  onLoad(option) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.positionId = option.positionId;
    this.parentOrgId = option.parentOrgId;
    this.positionName = option.positionName;
  },

  getPassword(e) {
    this.setData({
      'passwordData.password': e.detail.value,
    });
    this.userValidateForm();
  },
  focusPassword(e) {
    this.setData({
      activePassword: true,
    });
  },
  blurPassword() {
    this.setData({
      activePassword: false,
    });
  },
  getconfirmPassword(e) {
    this.setData({
      'passwordData.confirmPassword': e.detail.value,
    });
    this.userValidateForm();
  },
  focusConfirmPassword() {
    this.setData({
      activeConfirmPassword: true,
    });
  },
  blurConfirmPassword() {
    this.setData({
      activeConfirmPassword: false,
    });
  },
  toSselectGender(e) {
    this.setData({
      'passwordData.gender': e.currentTarget.dataset.gender,
    });
    this.userValidateForm();
  },

  userValidateForm() {
    let passwordData = this.data.passwordData;
    let [password, confirmPassword, gender] = [
      passwordData.password,
      passwordData.confirmPassword,
      passwordData.gender,
    ];
    if (password && confirmPassword && (gender === 0 || gender === 1)) {
      this.setData({
        useBtnShow: true,
      });
    } else {
      this.setData({
        useBtnShow: false,
      });
    }
  },

  validateFrom() {
    let passwordData = this.data.passwordData;
    let [password, confirmPassword, gender] = [
      passwordData.password,
      passwordData.confirmPassword,
      passwordData.gender,
    ];
    let reg = /^\d{6}$/;
    if (password.trim() === '') {
      wx.showToast({
        icon: 'none',
        title: '密码不能为空',
        duration: 1000,
      });
      return false;
    }
    if (!reg.test(password.trim())) {
      wx.showToast({
        icon: 'none',
        title: '密码是数字且是6位',
        duration: 1000,
      });
      return false;
    }
    if (confirmPassword.trim() === '') {
      wx.showToast({
        icon: 'none',
        title: '确认密码不能为空',
        duration: 1000,
      });
      return false;
    }
    if (!reg.test(confirmPassword.trim())) {
      wx.showToast({
        icon: 'none',
        title: '密码是数字且是6位',
        duration: 1000,
      });
      return false;
    }
    if (confirmPassword.trim() !== password.trim()) {
      wx.showToast({
        icon: 'none',
        title: '两次密码不一致',
        duration: 1000,
      });
      return false;
    }
    if (gender == null) {
      wx.showToast({
        icon: 'none',
        title: '请选择性别',
        duration: 1000,
      });
      return false;
    }
    return true;
  },

  async changePwd() {
    if (this.validateFrom()) {
      this.onConfirmPassword();
    }
  },

  async onConfirmPassword() {
    let params = {
      password: this.data.passwordData.password,
      confirmPassword: this.data.passwordData.confirmPassword,
      gender: this.data.passwordData.gender,
    };
    app.$post('shower/password/saveShowerPasswordAndGender', params).then(_ => {
      wx.showToast({
        title: '设置密码成功',
        icon: 'success',
        duration: 1000,
        success: () => {
          wx.redirectTo({
            url: `/shower/showerMachine/showerMachine?positionId=${this.positionId}&parentOrgId=${this.parentOrgId}&positionName=${this.positionName}`,
          });
        },
      });
    });
  },
});