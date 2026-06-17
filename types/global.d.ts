/// <reference types="@tarojs/taro" />

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.styl';

interface SpeechSynthesisUtterance {
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
}

interface SpeechSynthesis {
  cancel(): void;
  speak(utterance: SpeechSynthesisUtterance): void;
  getVoices(): SpeechSynthesisVoice[];
}

interface SpeechSynthesisVoice {
  lang: string;
  name: string;
}

interface Window {
  speechSynthesis: SpeechSynthesis;
  SpeechSynthesisUtterance: new (text?: string) => SpeechSynthesisUtterance;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production',
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd'
    TARO_APP_ID: string
  }
}
