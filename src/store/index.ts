import { create } from 'zustand';
import { QueueInfo, RecordItem, RecordRating } from '@/types';
import { recordList as initialRecordList } from '@/data/records';
import { currentQueue as initialQueue } from '@/data/queue';

interface SettingsState {
  voiceEnabled: boolean;
  vibrateEnabled: boolean;
  bigFontMode: boolean;
  systemNotice: boolean;
}

interface AppState {
  currentQueue: QueueInfo | null;
  hasRequeued: boolean;
  queueCancelled: boolean;
  records: RecordItem[];
  settings: SettingsState;

  setQueue: (queue: QueueInfo | null) => void;
  cancelQueue: () => void;
  requeue: (updatedQueue: QueueInfo) => void;
  resetQueue: () => void;

  updateRecordRating: (recordId: string, rating: number, detail: RecordRating) => void;

  setVoiceEnabled: (enabled: boolean) => void;
  setVibrateEnabled: (enabled: boolean) => void;
  setBigFontMode: (enabled: boolean) => void;
  setSystemNotice: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentQueue: initialQueue ? { ...initialQueue } : null,
  hasRequeued: false,
  queueCancelled: false,
  records: initialRecordList.map(r => ({ ...r })),
  settings: {
    voiceEnabled: true,
    vibrateEnabled: true,
    bigFontMode: false,
    systemNotice: true,
  },

  setQueue: (queue) => set({
    currentQueue: queue ? { ...queue } : null,
    hasRequeued: false,
    queueCancelled: false,
  }),

  cancelQueue: () => set({
    queueCancelled: true,
    currentQueue: null,
  }),

  requeue: (updatedQueue) => set({
    currentQueue: { ...updatedQueue },
    hasRequeued: true,
  }),

  resetQueue: () => set({
    currentQueue: null,
    hasRequeued: false,
    queueCancelled: false,
  }),

  updateRecordRating: (recordId, rating, detail) => set((state) => ({
    records: state.records.map(r =>
      r.id === recordId
        ? { ...r, rating, ratingDetail: { ...detail }, comment: detail.comment }
        : r
    ),
  })),

  setVoiceEnabled: (enabled) => set((state) => ({
    settings: { ...state.settings, voiceEnabled: enabled },
  })),

  setVibrateEnabled: (enabled) => set((state) => ({
    settings: { ...state.settings, vibrateEnabled: enabled },
  })),

  setBigFontMode: (enabled) => set((state) => ({
    settings: { ...state.settings, bigFontMode: enabled },
  })),

  setSystemNotice: (enabled) => set((state) => ({
    settings: { ...state.settings, systemNotice: enabled },
  })),
}));
