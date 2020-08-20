class Log {
  constructor(host, project, logstore) {
    this._url =
      'https://' +
      project +
      '.' +
      host +
      '/logstores/' +
      logstore +
      '/track?APIVersion=0.6.0';
    this._params = {};
    this._msg = [];
    this._errMsg = [];
    this._commonData = {};
  }

  setConfig(data = {}) {
    this._commonData = Object.assign({}, this._commonData, data);
  }

  push(data = {}) {
    Object.assign(this._params, data);

    return this;
  }

  async done() {
    await wx.request({
      url: this._url,
      data: Object.assign({
          msg: JSON.stringify(this._msg),
          errMsg: JSON.stringify(this._errMsg),
        },
        this._commonData,
        this._params
      ),
    });

    // clear all user data
    this._params = {};
    this._errMsg = [];
    this._msg = [];
  }

  success(msg) {
    this._msg.push(msg);
  }

  error(errMsg) {
    this._errMsg.push(errMsg);
  }
}
const log = new Log(
  'cn-shanghai.log.aliyuncs.com',
  'qiekj-web-log',
  'alipay-log'
);
export default log;