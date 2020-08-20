/**
 * 通用缓存处理
 * 1. 封装缓存写入
 * 2. 封装缓存读取
 * 3. 封装缓存过期
 */

const Cache = {
  /**
   * 写入缓存
   * key: key
   * data: data
   * expire: 有效期，单位s，默认0，永久缓存
   */
  async set(key, data, expire = 0) {
    try {
      wx.setStorage({
        key,
        data
      });
      return null;
    } catch (e) {
      console.log('写入缓存失败', {
        key,
        data,
        expire,
        e
      });
      return null;
    }
  },

  /**
   * 获取缓存
   * key: key
   */
  async get(key) {
    try {
      return new Promise((resolve, reject) => {
        wx.getStorage({
          key,
          success: function(res) {
            resolve(res.data);
          },
          fail: function(res) {
            reject(res);
          },
        });
      });
    } catch (e) {
      console.log('读取缓存失败', {
        key,
        e
      });
      return await Promise.reject(e);
    }
  },

  /**
   * 删除缓存
   * @param key key
   * @returns void
   */
  async remove(key) {
    try {
      // 删除缓存值
      wx.removeStorage({
        key
      });
    } catch (e) {
      console.log('删除缓存失败', {
        key,
        e
      });
    }
  },
};

export default Cache;