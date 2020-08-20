/**
 * http统一业务处理器
 */
const HttpErrorHandler = {
  // 错误mapping
  map: {},

  // code是否正在处理，防止多次异步访问造成重复处理
  lock: {},

  /**
   * 获取对应的错误事件处理函数，可以用来检测是否已经注册了错误处理事件
   * 如果不传code，返回所有
   *
   * @param {int} code
   */
  get(code) {
    return this.map[code];
  },

  /**
   * 添加错误处理器
   * 注意: 如事件监听一样，同一个code可以注册多个事件，按时间顺序一一执行
   *
   * @param {int} code
   * @param {Funciton} cb
   */
  add(code, fun) {
    if (code > 0 && fun instanceof Function) {
      if (!this.map[code]) {
        // 不存在，初始化
        this.map[code] = [];
      }
      this.map[code].push(fun);
    }
  },

  /**
   * 注册默认错误处理器(默认处理器只能有一个事件处理)
   *
   * @param {Fucntion} fun
   */
  addDefault(fun) {
    if (fun instanceof Function) {
      this.map[0] = [fun];
    }
  },

  /**
   * 删除绑定的code事件
   * @param {int} code
   */
  remove(code) {
    if (code > 0) {
      delete this.map[code];
    }
  },

  /**
   * 执行对应的错误处理器， 如果code不存在，执行默认处理器
   *
   * @param {int} code
   * @param {*} response
   */
  async run(code, response = {}) {
    code = this.map[code] ? code : 0;
    // 判断锁
    if (this.lock[code]) return;

    if (this.map[code]) {
      // 加锁
      this.lock[code] = true;
      try {
        for (let f of this.map[code]) {
          await f(response);
        }
      } finally {
        delete this.lock[code];
      }
    }
  },
};

export default HttpErrorHandler;