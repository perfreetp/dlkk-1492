import Taro from '@tarojs/taro';

let audioContext: any = null;

const getAudioContext = () => {
  if (audioContext) return audioContext;
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    try {
      audioContext = Taro.createInnerAudioContext();
      audioContext.obeyMuteSwitch = false;
    } catch (e) {
      console.warn('createInnerAudioContext error', e);
    }
  }
  return audioContext;
};

const playDing = () => {
  const ctx = getAudioContext();
  if (ctx) {
    ctx.src = 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/sound.mp3';
    ctx.play();
  }
  try {
    Taro.vibrateShort({ type: 'medium' });
  } catch (e) {
    // ignore
  }
};

export const speak = (text: string) => {
  if (typeof window !== 'undefined' && window.speechSynthesis && window.SpeechSynthesisUtterance) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.warn('speechSynthesis error', e);
    }
  }

  try {
    playDing();
    Taro.showToast({
      title: text.slice(0, 15),
      icon: 'none',
      duration: 2000,
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
