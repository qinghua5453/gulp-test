import moment from 'moment';
import {
  TimeUnit
} from './Mapping';

//转换成hex编码
const stringToHex = str => {
  var val = '';
  for (var i = 0; i < str.length; i++) {
    if (val == '') {
      val = str.charCodeAt(i).toString(16);
    } else {
      val += str.charCodeAt(i).toString(16);
    }
  }
  return val;
};

//转换成string
const hexToString = hex => {
  var string = '';
  for (var i = 0; i < hex.length; i += 2) {
    string += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return string;
};

/**
 * 重写页面跳转，防止重复跳转
 *
 * @param {String} url 需要跳转的url
 * @param {Function} preFun 跳转前，前置处理函数
 * @param {String}} model 跳转模式navigate, redirect, reLaunch
 */
const to = async (url, preFun = null, model = 'navigate') => {
  // 获取当前页面
  let currentPagesArr = getCurrentPages();
  let currentPageRoute = currentPagesArr[currentPagesArr.length - 1].route;
  if (url.indexOf(currentPageRoute) !== -1) {
    return await Promise.resolve();
  }
  try {
    if (preFun instanceof Function) await preFun();
    switch (model) {
      case 'redirect':
        return await wx.redirectTo({
          url
        });
      case 'reLaunch':
        return await wx.reLaunch({
          url
        });
      default:
        return await wx.navigateTo({
          url
        });
    }
  } catch (e) {
    return await Promise.reject(e);
  }
};

// 避免按钮多次重复点击
const throttle = (fn, gapTime) => {
  if (gapTime == null || gapTime == undefined) {
    gapTime = 1500;
  }
  let _lastTime = null;
  // 返回新的函数
  return function() {
    let _nowTime = +new Date();
    if (_nowTime - _lastTime > gapTime || !_lastTime) {
      fn.apply(this, arguments); //将this和参数传给原函数
      _lastTime = _nowTime;
    }
  };
};
const formatSecond = result => {
  const h = Math.floor((result / 3600) % 24);
  const m = Math.floor((result / 60) % 60);
  const s = Math.floor(result % 60);
  if (h < 1) {
    if (m <= 0) {
      return (result = s + '秒');
    } else {
      return (result = m + '分' + s + '秒');
    }
  } else {
    return (result = h + '小时' + m + '分');
  }
};
/**
 * 前补充字符串到固定长度(补0)
 *
 * @param data 数据
 * @param length 长度
 * @param str 补充字符
 * @param pos 位置 0 前补 1 后补
 *
 */
const padNum = (data, length, str = '0', pos = 0) => {
  let fill = Array(length).join(str);
  return pos === 0 ? (fill + data).slice(-length) : (data + fill).slice(length);
};

const promiseTimeout = function(ms, promise) {
  // Create a promise that rejects in <ms> milliseconds
  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject('Timed out in ' + ms + 'ms.');
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
};

const geturlName = (url, name) => {
  //let url = 'alipays://platformapi/startapp?appId=2018091261350219&page=/pages/h5pages/h5pages?targetURI=https://mo.m.taobao.com/etao/xiaochengxutaobaohongbao?pid=mm_357170150_400250174_107171650190&query=inviterCode=Cus0kqxPPAM3XWc9CX%2F8s1TLHYIej0ii'
  //let url = 'alipays://platformapi/startapp?appId=2018091261350219&page=pages/cart/cart&query=inviterCode=Cus0kqxPPAM3XWc9CX%2F8s1TLHYIej0ii'
  //let url = 'inviterCode=Cus0kqxPPAM3XWc9CX%2F8s1TLHYIej0ii'
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
  var r = null;
  if (name === 'appId') {
    r = url.split('?')[1].match(reg);
  } else {
    r = url.match(reg);
  }
  if (r != null) return unescape(r[2]);
  return null;
};

// 通过url获取指定参数
const getQueryString = (url, name) => {
  return (
    decodeURIComponent(
      (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url) || [
        '',
      ])[1].replace(/\+/g, '%20')
    ) || null
  );
};

function parseZhongkaMachine(str) {
  if (str.indexOf('https') == 0) {
    str = str.substring(str.lastIndexOf('a6?') + 3); //要解析的所有数据(包括mac)
  }
  return {
    id: str.substr(2, 8),
    data: str.substr(0, 40),
    mac: str.substr(40, 12).toUpperCase(),
  };
}
// 格式化时间差为00:00:00格式时间
const formatDuration = timestamp => {
  const format = v => {
    return (v + '').padStart(2, 0);
  };
  let duration = moment.duration(timestamp, 'seconds');
  return (
    format(duration.hours()) +
    ':' +
    format(duration.minutes()) +
    ':' +
    format(duration.seconds())
  );
};
const formatMinutes = timestamp => {
  let duration = moment.duration(timestamp, 'seconds');
  return duration.minutes();
};
const formatHourMinutes = timestamp => {
  let duration = moment.duration(timestamp, 'seconds');
  return duration.hours() + ':' + duration.minutes();
};

// 格式化时间差为00:00格式时间 分秒
const formatDurationTwo = timestamp => {
  const format = v => {
    return (v + '').padStart(2, 0);
  };
  let duration = moment.duration(timestamp, 'seconds');
  return format(duration.minutes()) + ':' + format(duration.seconds());
};

// 格式化时间差为00格式时间 分
const formatDurationThree = timestamp => {
  const format = v => {
    return (v + '').padStart(2);
  };
  let duration = moment.duration(timestamp, 'seconds');
  return format(duration.minutes());
};

// 格式化时间差为00:00时间 小时分钟
const formatHourDuration = timestamp => {
  const format = v => {
    return (v + '').padStart(2, 0);
  };
  let duration = moment.duration(timestamp, 'seconds');
  return format(duration.hours()) + ':' + format(duration.minutes());
};
/**
 * 把秒时间转化为单位时间的文本
 * 如 5h 60m 300s
 *
 * @param seconds 时间s
 * @param unit 单位
 * @param isTimeUnit 是否使用TimeUnit转换
 */

const formatTimeUnit = (seconds, unit, isTimeUnit) => {
  switch (unit) {
    case 'm':
      seconds /= 60;
      break;
    case 'h':
      seconds /= 3600;
      break;
  }

  if (isTimeUnit) {
    unit = TimeUnit[unit];
  }

  return seconds + unit;
};
const countDown = time => {
  const app = getApp();
  const NowTime = moment(app.globalData.nowTime + new Date().getTime());
  const formatTime = moment(time);
  const subTime = (Number(NowTime) - Number(formatTime)) / 1000;
  return Math.floor(subTime);
};

const getCurrentPage = () => {
  let pages = getCurrentPages();
  let _route = '';
  if (pages.length) {
    const currentPage = pages[pages.length - 1];
    _route = currentPage.route;
  }
  return _route;
};

export default {
  stringToHex,
  geturlName,
  formatSecond,
  parseZhongkaMachine,
  formatDuration,
  formatDurationTwo,
  formatDurationThree,
  formatHourDuration,
  formatTimeUnit,
  hexToString,
  throttle,
  to,
  getQueryString,
  padNum,
  promiseTimeout,
  countDown,
  formatHourMinutes,
  formatMinutes,
  getCurrentPage,
};