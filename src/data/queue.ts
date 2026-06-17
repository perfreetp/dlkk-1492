import { QueueInfo } from '@/types';

export const currentQueue: QueueInfo | null = {
  id: 'q1',
  hallId: 'hall-1',
  hallName: '市政务服务中心',
  serviceName: '不动产登记',
  queueNumber: 'A0256',
  currentNumber: 'A0243',
  aheadCount: 13,
  waitTime: 25,
  status: 'waiting',
  takeTime: '2026-06-17 09:30',
  estimatedCallTime: '2026-06-17 10:05',
  materialsReady: false,
  missingMaterials: ['完税证明']
};

export const generateQueueNumber = (prefix: string, num: number): string => {
  return `${prefix}${num.toString().padStart(4, '0')}`;
};

export const mockTakeNumber = (hallId: string, serviceName: string): QueueInfo => {
  const hallNames: Record<string, string> = {
    'hall-1': '市政务服务中心',
    'hall-2': '区政务服务分中心',
    'hall-3': '街道便民服务中心',
    'hall-4': '市民服务中心',
    'hall-5': '开发区政务中心'
  };
  
  const prefixes = ['A', 'B', 'C', 'D', 'E'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const queueNum = Math.floor(Math.random() * 500) + 200;
  const currentNum = queueNum - Math.floor(Math.random() * 20) - 5;
  const ahead = queueNum - currentNum;
  
  const now = new Date();
  const takeTime = now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  const estTime = new Date(now.getTime() + ahead * 2 * 60000);
  const estimatedCallTime = estTime.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  
  return {
    id: `q-${Date.now()}`,
    hallId,
    hallName: hallNames[hallId] || '政务大厅',
    serviceName,
    queueNumber: `${prefix}${queueNum.toString().padStart(4, '0')}`,
    currentNumber: `${prefix}${currentNum.toString().padStart(4, '0')}`,
    aheadCount: ahead,
    waitTime: ahead * 2,
    status: 'waiting',
    takeTime,
    estimatedCallTime,
    materialsReady: true
  };
};
