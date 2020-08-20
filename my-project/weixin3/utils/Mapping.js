/**
 * 数据映射类
 */

//========= 错误 ==========//
// 这里的错误特殊处理
export const ErrorMessage = {
  4000: '设备故障，请更换设备使用。【故障码：4000】',
  4107: '设备故障，请更换设备使用。【故障码：4107】',
  4109: '设备工作中，请更换设备使用',
  4103: '设备故障，请更换设备使用。【故障码：4103】',
  4110: '设备故障，请更换设备使用。【故障码：4110】',
};

//========= 机器 ==========//
// 机器状态
export const MachineStatus = {
  1: '空闲',
  2: '工作',
  3: '暂停',
  4: '故障',
  5: '参数设置',
  6: '自检',
  7: '预约',
  8: '离线',
  9: '删除',
  10: '阿里未激活',
  11: '阿里不存在',
  21: '工作',
};

// 机器阿里状态
export const MachineAliStatus = {
  0: '未激活',
  1: '在线',
  2: '离线',
  3: '不存在',
};

// 机器模块公司
export const MachineCompany = {
  huiren: '慧人',
  youfang: '有方',
  hezhou: '合宙',
};

//============订单============//
// 支付方式
export const PayType = {
  1: '微信',
  2: '余额',
  3: '微信',
};

// 订单状态
export const OrderStatus = {
  0: '未支付',
  1: '支付超时',
  2: '已支付',
  3: '已完成',
  4: '申请退款',
  5: '已退款',
};

//消费类型状态
export const Direction = {
  1: '已支付',
  2: '已充值',
  3: '已提现',
  4: '已退款',
  5: '已补偿',
};

//优惠券类型
export const CouponType = {
  0: '不限设备',
  1: '洗衣机',
  2: '烘干机',
  3: '洗鞋机',
  4: '吹风机',
  5: '充电桩',
  6: '饮水机',
};

//Vip卡类型
export const VipType = {
  1: '年卡',
  2: '半年卡',
  3: '季卡',
};

// 机器类型
export const MachineType = {
  'c9892cb4-bd78-40f6-83c2-ba73383b090a': 1, // 洗衣机
  '4a245cde-538b-47d8-aa35-dd4a28c0e901': 2, // 烘干机
  'ef5b8f13-36ec-44fb-8179-38627abd9be0': 3, // 洗鞋机
  '4eeb1b0a-d006-49cc-bf17-73c20599057b': 4, // 吹风机
  '4eeb1b0a-d006-49cc-bf17-73c20599057c': 5, // 充电桩
  '4eeb1b0a-d006-49cc-bf17-73c20599057e': 6, // 饮水机
  '493075751319372662': 7, // 淋浴
  '430009623810933477': 8, //按摩椅
};

// 时间单位
export const TimeUnit = {
  s: '秒',
  m: '分',
  h: '小时',
  ml: '毫升',
  L: '升',
};

export const ChargState = {
  0: '未开始',
  1: '正在充电',
  2: '充电中断',
  3: '充电完成',
  4: '已充满',
};

export const InviteStatus = {
  0: '活动已经结束了',
  2: '活动已经结束了',
  3: '活动已经结束了',
  4: '您不符合领券条件',
  5: '活动已经结束了',
};

// 店铺状态
export const ShopState = {
  1: '未开放',
  2: '营业中',
  3: '关店',
  4: '删除',
};
export const DRY = {
  type: 1,
  name: '烘干机',
  id: '4a245cde-538b-47d8-aa35-dd4a28c0e901',
};
export const HAIR_DRY = {
  type: 2,
  name: '吹风机',
  id: '4eeb1b0a-d006-49cc-bf17-73c20599057b',
};
export const CHARGING = {
  type: 3,
  name: '充电桩',
  id: '4eeb1b0a-d006-49cc-bf17-73c20599057c',
};
export const COFE = {
  type: 4,
  name: '咖啡机',
  id: '4eeb1b0a-d006-49cc-bf17-73c20599057d',
};
export const DRINKING = {
  type: 5,
  name: '饮水机',
  id: '4eeb1b0a-d006-49cc-bf17-73c20599057e',
};
export const AIR_CONDITIONER = {
  type: 6,
  name: '空调',
  id: '4eeb1b0a-d006-49cc-bf17-73c20599057f',
};
export const WASH = {
  type: 7,
  name: '洗衣机',
  id: 'c9892cb4-bd78-40f6-83c2-ba73383b090a',
};
export const SHOE = {
  type: 8,
  name: '洗鞋机',
  id: 'ef5b8f13-36ec-44fb-8179-38627abd9be0',
};
export const MASSAGE = {
  type: 9,
  name: '按摩椅',
  id: '430009623810933477',
};
export const TAKE_SHOWER = {
  type: 10,
  name: '淋浴',
  id: '493075751319372662',
};
export const ShopMachineType = {
  [DRY.type]: DRY.name,
  [HAIR_DRY.type]: HAIR_DRY.name,
  [CHARGING.type]: CHARGING.name,
  [COFE.type]: COFE.name,
  [DRINKING.type]: DRINKING.name,
  [AIR_CONDITIONER.type]: AIR_CONDITIONER.name,
  [WASH.type]: WASH.name,
  [SHOE.type]: SHOE.name,
  [MASSAGE.type]: MASSAGE.name,
  [TAKE_SHOWER.type]: TAKE_SHOWER.name,
};