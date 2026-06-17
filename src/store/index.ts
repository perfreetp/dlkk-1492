import { create } from 'zustand';
import { QueueInfo, RecordItem, RecordRating } from '@/types';
import { recordList as initialRecordList } from '@/data/records';
import { currentQueue as initialQueue } from '@/data/queue';
import { storageKeys, setStorage, getStorage } from '@/utils/storage';

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
  selectedHallId: string | null;

  setQueue: (queue: QueueInfo | null) => void;
  cancelQueue: () => void;
  requeue: (updatedQueue: QueueInfo) => void;
  resetQueue: () => void;
  updateQueue: (updates: Partial<QueueInfo>) => void;

  addRecord: (record: RecordItem) => void;
  updateRecordStatus: (recordId: string, status: RecordItem['status'], extra?: Partial<RecordItem>) => void;
  updateRecordRating: (recordId: string, rating: number, detail: RecordRating) => void;

  setSelectedHallId: (hallId: string | null) => void;

  setVoiceEnabled: (enabled: boolean) => void;
  setVibrateEnabled: (enabled: boolean) => void;
  setBigFontMode: (enabled: boolean) => void;
  setSystemNotice: (enabled: boolean) => void;
}

const loadInitialState = () => {
  const savedQueue = getStorage<QueueInfo | null>(storageKeys.currentQueue, null);
  const savedHasRequeued = getStorage<boolean>(storageKeys.hasRequeued, false);
  const savedCancelled = getStorage<boolean>(storageKeys.queueCancelled, false);
  const savedRecords = getStorage<RecordItem[] | null>(storageKeys.records, null);
  const savedSettings = getStorage<Partial<SettingsState> | null>(storageKeys.settings, null);
  const savedHallId = getStorage<string | null>(storageKeys.selectedHallId, null);

  return {
    currentQueue: savedQueue || (initialQueue ? { ...initialQueue } : null),
    hasRequeued: savedHasRequeued,
    queueCancelled: savedCancelled,
    records: savedRecords && savedRecords.length > 0
      ? savedRecords.map(r => ({ ...r }))
      : initialRecordList.map(r => ({ ...r })),
    settings: {
      voiceEnabled: true,
      vibrateEnabled: true,
      bigFontMode: false,
      systemNotice: true,
      ...(savedSettings || {}),
    },
    selectedHallId: savedHallId,
  };
};

const persistQueueState = (queue: QueueInfo | null, hasRequeued: boolean, queueCancelled: boolean) => {
  setStorage(storageKeys.currentQueue, queue);
  setStorage(storageKeys.hasRequeued, hasRequeued);
  setStorage(storageKeys.queueCancelled, queueCancelled);
};

const persistRecords = (records: RecordItem[]) => {
  setStorage(storageKeys.records, records);
};

const persistSettings = (settings: SettingsState) => {
  setStorage(storageKeys.settings, settings);
};

export const useAppStore = create<AppState>((set, get) => {
  const initial = loadInitialState();

  return {
    currentQueue: initial.currentQueue,
    hasRequeued: initial.hasRequeued,
    queueCancelled: initial.queueCancelled,
    records: initial.records,
    settings: initial.settings,
    selectedHallId: initial.selectedHallId,

    setQueue: (queue) => {
      const newQueue = queue ? { ...queue } : null;
      set({
        currentQueue: newQueue,
        hasRequeued: false,
        queueCancelled: false,
      });
      persistQueueState(newQueue, false, false);
    },

    cancelQueue: () => {
      const queue = get().currentQueue;
      set({
        queueCancelled: true,
        currentQueue: null,
        hasRequeued: false,
      });
      persistQueueState(null, false, true);

      if (queue) {
        const recordId = `rec-${queue.id}`;
        const existing = get().records.find(r => r.id === recordId);
        if (existing) {
          const newRecords = get().records.map(r =>
            r.id === recordId ? { ...r, status: 'cancelled' as const } : r
          );
          set({ records: newRecords });
          persistRecords(newRecords);
        } else {
          const record: RecordItem = {
            id: recordId,
            hallName: queue.hallName,
            serviceName: queue.serviceName,
            queueNumber: queue.queueNumber,
            takeTime: queue.takeTime,
            status: 'cancelled',
          };
          const newRecords = [record, ...get().records];
          set({ records: newRecords });
          persistRecords(newRecords);
        }
      }
    },

    requeue: (updatedQueue) => {
      const newQueue = { ...updatedQueue };
      set({
        currentQueue: newQueue,
        hasRequeued: true,
      });
      persistQueueState(newQueue, true, false);

      const recordId = `rec-${newQueue.id}`;
      const existing = get().records.find(r => r.id === recordId);
      if (existing) {
        const newRecords = get().records.map(r =>
          r.id === recordId ? { ...r, status: 'passed' as const } : r
        );
        set({ records: newRecords });
        persistRecords(newRecords);
      }
    },

    resetQueue: () => {
      set({
        currentQueue: null,
        hasRequeued: false,
        queueCancelled: false,
      });
      persistQueueState(null, false, false);
    },

    updateQueue: (updates) => {
      set((state) => {
        if (!state.currentQueue) return state;
        const newQueue = { ...state.currentQueue, ...updates };
        persistQueueState(newQueue, state.hasRequeued, state.queueCancelled);
        return { currentQueue: newQueue };
      });
    },

    addRecord: (record) => {
      set((state) => {
        const newRecords = [record, ...state.records];
        persistRecords(newRecords);
        return { records: newRecords };
      });
    },

    updateRecordStatus: (recordId, status, extra) => {
      set((state) => {
        const newRecords = state.records.map(r =>
          r.id === recordId ? { ...r, status, ...(extra || {}) } : r
        );
        persistRecords(newRecords);
        return { records: newRecords };
      });
    },

    updateRecordRating: (recordId, rating, detail) => {
      set((state) => {
        const newRecords = state.records.map(r =>
          r.id === recordId
            ? { ...r, rating, ratingDetail: { ...detail }, comment: detail.comment }
            : r
        );
        persistRecords(newRecords);
        return { records: newRecords };
      });
    },

    setSelectedHallId: (hallId) => {
      set({ selectedHallId: hallId });
      setStorage(storageKeys.selectedHallId, hallId);
    },

    setVoiceEnabled: (enabled) => {
      set((state) => {
        const newSettings = { ...state.settings, voiceEnabled: enabled };
        persistSettings(newSettings);
        return { settings: newSettings };
      });
    },

    setVibrateEnabled: (enabled) => {
      set((state) => {
        const newSettings = { ...state.settings, vibrateEnabled: enabled };
        persistSettings(newSettings);
        return { settings: newSettings };
      });
    },

    setBigFontMode: (enabled) => {
      set((state) => {
        const newSettings = { ...state.settings, bigFontMode: enabled };
        persistSettings(newSettings);
        return { settings: newSettings };
      });
    },

    setSystemNotice: (enabled) => {
      set((state) => {
        const newSettings = { ...state.settings, systemNotice: enabled };
        persistSettings(newSettings);
        return { settings: newSettings };
      });
    },
  };
});
