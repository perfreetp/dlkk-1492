import Taro from '@tarojs/taro';

const PREFIX = 'queue_app_';

export const storageKeys = {
  currentQueue: `${PREFIX}currentQueue`,
  hasRequeued: `${PREFIX}hasRequeued`,
  queueCancelled: `${PREFIX}queueCancelled`,
  records: `${PREFIX}records`,
  settings: `${PREFIX}settings`,
  hasSpoken: `${PREFIX}hasSpoken`,
};

export const setStorage = <T>(key: string, data: T): void => {
  try {
    Taro.setStorageSync(key, data);
  } catch (e) {
    console.error('setStorage error', key, e);
  }
};

export const getStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data === '' || data === undefined || data === null) {
      return defaultValue;
    }
    return data as T;
  } catch (e) {
    console.error('getStorage error', key, e);
    return defaultValue;
  }
};

export const removeStorage = (key: string): void => {
  try {
    Taro.removeStorageSync(key);
  } catch (e) {
    console.error('removeStorage error', key, e);
  }
};
