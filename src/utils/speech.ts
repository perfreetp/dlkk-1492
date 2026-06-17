import Taro from '@tarojs/taro';

let audioContext: any = null;
let audioInitialized = false;

const getAudioContext = () => {
  if (audioContext) return audioContext;
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return null;
    }
    audioContext = Taro.createInnerAudioContext();
    audioContext.obeyMuteSwitch = false;
    audioInitialized = true;
  } catch (e) {
    console.warn('createInnerAudioContext error', e);
  }
  return audioContext;
};

const playDingSound = () => {
  const ctx = getAudioContext();
  if (ctx) {
    ctx.src = 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/sound.mp3';
    ctx.play();
  }
};

const vibratePattern = (pattern: 'short' | 'long' | 'double') => {
  try {
    if (pattern === 'short') {
      Taro.vibrateShort({ type: 'medium' });
    } else if (pattern === 'long') {
      Taro.vibrateLong();
    } else if (pattern === 'double') {
      Taro.vibrateShort({ type: 'heavy' });
      setTimeout(() => Taro.vibrateShort({ type: 'heavy' }), 300);
    }
  } catch (e) {
    // ignore
  }
};

export const speak = (text: string, options?: { type?: 'normal' | 'calling' | 'warning' }) => {
  const type = options?.type || 'normal';

  if (typeof window !== 'undefined' && window.speechSynthesis && window.SpeechSynthesisUtterance) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = type === 'calling' ? 0.9 : 0.95;
      utterance.pitch = type === 'calling' ? 1.1 : 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.warn('speechSynthesis error', e);
    }
  }

  try {
    if (type === 'calling') {
      vibratePattern('double');
    } else if (type === 'warning') {
      vibratePattern('long');
    } else {
      vibratePattern('short');
    }
    playDingSound();

    Taro.showModal({
      title: type === 'calling' ? '🔔 叫号提醒' : '📢 语音播报',
      content: text,
      showCancel: false,
      confirmText: '知道了',
    });
    return true;
  } catch (e) {
    console.warn('speak fallback error', e);
    return false;
  }
};

export const stopSpeak = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
  if (audioContext) {
    try {
      audioContext.stop();
    } catch (e) {
      // ignore
    }
  }
};

export const isSpeechSupported = (): boolean => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return true;
  }
  return audioInitialized;
};
