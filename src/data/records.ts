import { RecordItem, ReminderItem } from '@/types';

export const recordList: RecordItem[] = [
  {
    id: 'r1',
    hallName: '市政务服务中心',
    serviceName: '社保卡办理',
    queueNumber: 'B0123',
    takeTime: '2026-06-15 09:15',
    completeTime: '2026-06-15 09:45',
    status: 'completed',
    windowNo: 'B03',
    rating: 5,
    comment: '办理速度很快，工作人员态度很好'
  },
  {
    id: 'r2',
    hallName: '市民服务中心',
    serviceName: '公积金提取',
    queueNumber: 'D0089',
    takeTime: '2026-06-10 14:20',
    completeTime: '2026-06-10 15:10',
    status: 'completed',
    windowNo: 'D02',
    rating: 4
  },
  {
    id: 'r3',
    hallName: '区政务服务分中心',
    serviceName: '户口迁移',
    queueNumber: 'C0056',
    takeTime: '2026-06-05 10:30',
    status: 'passed',
    windowNo: 'C01'
  },
  {
    id: 'r4',
    hallName: '市政务服务中心',
    serviceName: '营业执照办理',
    queueNumber: 'E0201',
    takeTime: '2026-05-28 09:00',
    completeTime: '2026-05-28 10:30',
    status: 'completed',
    windowNo: 'E05',
    rating: 5,
    comment: '一站式服务很方便'
  },
  {
    id: 'r5',
    hallName: '街道便民服务中心',
    serviceName: '医保报销',
    queueNumber: 'A0034',
    takeTime: '2026-05-20 15:40',
    completeTime: '2026-05-20 16:00',
    status: 'completed',
    windowNo: 'A02',
    rating: 4
  },
  {
    id: 'r6',
    hallName: '开发区政务中心',
    serviceName: '税务登记',
    queueNumber: 'F0078',
    takeTime: '2026-05-15 11:00',
    status: 'cancelled'
  }
];

export const reminderList: ReminderItem[] = [
  {
    id: 'rm1',
    type: 'call',
    title: '即将叫号提醒',
    content: '您的号码 A0256 前面还有 5 位，预计 10 分钟后叫号，请您做好准备。',
    time: '10分钟前',
    read: false,
    relatedQueueId: 'q1'
  },
  {
    id: 'rm2',
    type: 'material',
    title: '材料缺失提醒',
    content: '您办理的不动产登记业务缺少完税证明，请提前准备好相关材料。',
    time: '30分钟前',
    read: false,
    relatedQueueId: 'q1'
  },
  {
    id: 'rm3',
    type: 'queue',
    title: '取号成功',
    content: '您已成功在市政务服务中心取号，号码 A0256，前方有 13 人等待。',
    time: '1小时前',
    read: true,
    relatedQueueId: 'q1'
  },
  {
    id: 'rm4',
    type: 'system',
    title: '系统通知',
    content: '市政务服务中心新增潮汐窗口，不动产登记业务办理速度提升。',
    time: '2小时前',
    read: true
  },
  {
    id: 'rm5',
    type: 'queue',
    title: '叫号通知',
    content: '请 B0123 号到 B03 窗口办理社保卡业务。',
    time: '2天前',
    read: true
  }
];

export const getRecordsByStatus = (status: string): RecordItem[] => {
  if (status === 'all') return recordList;
  return recordList.filter(r => r.status === status);
};

export const getUnreadReminderCount = (): number => {
  return reminderList.filter(r => !r.read).length;
};
