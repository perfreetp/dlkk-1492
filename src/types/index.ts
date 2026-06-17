export interface HallInfo {
  id: string;
  name: string;
  address: string;
  distance: number;
  crowdLevel: 'green' | 'yellow' | 'red';
  crowdText: string;
  waitTime: number;
  windowCount: number;
  openWindows: number;
  tidalWindows: TidalWindow[];
  businessHours: string;
}

export interface TidalWindow {
  windowNo: string;
  serviceType: string;
  status: 'open' | 'closed';
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  supportOnlinePreview: boolean;
  requiredMaterials: string[];
  avgHandleTime: number;
  description: string;
}

export interface QueueInfo {
  id: string;
  hallId: string;
  hallName: string;
  serviceName: string;
  queueNumber: string;
  currentNumber: string;
  aheadCount: number;
  waitTime: number;
  status: 'waiting' | 'calling' | 'processing' | 'completed' | 'passed';
  windowNo?: string;
  takeTime: string;
  estimatedCallTime: string;
  materialsReady: boolean;
  missingMaterials?: string[];
}

export interface ReminderItem {
  id: string;
  type: 'call' | 'material' | 'queue' | 'system';
  title: string;
  content: string;
  time: string;
  read: boolean;
  relatedQueueId?: string;
}

export interface RecordItem {
  id: string;
  hallName: string;
  serviceName: string;
  queueNumber: string;
  takeTime: string;
  completeTime?: string;
  status: 'completed' | 'passed' | 'cancelled';
  windowNo?: string;
  rating?: number;
  comment?: string;
}

export interface UserInfo {
  name: string;
  idCard: string;
  phone: string;
  largeFontMode: boolean;
  voiceBroadcast: boolean;
}
