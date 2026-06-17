import { HallInfo } from '@/types';

export const hallList: HallInfo[] = [
  {
    id: 'hall-1',
    name: '市政务服务中心',
    address: '人民路1号政务大厦',
    distance: 0.8,
    crowdLevel: 'yellow',
    crowdText: '适中',
    waitTime: 25,
    windowCount: 20,
    openWindows: 16,
    tidalWindows: [
      { windowNo: 'A01', serviceType: '不动产登记', status: 'open' },
      { windowNo: 'A02', serviceType: '不动产登记', status: 'open' },
      { windowNo: 'B05', serviceType: '社保业务', status: 'closed' }
    ],
    businessHours: '09:00-17:00'
  },
  {
    id: 'hall-2',
    name: '区政务服务分中心',
    address: '解放路56号',
    distance: 2.3,
    crowdLevel: 'green',
    crowdText: '空闲',
    waitTime: 10,
    windowCount: 12,
    openWindows: 10,
    tidalWindows: [
      { windowNo: 'C01', serviceType: '户籍办理', status: 'open' }
    ],
    businessHours: '09:00-17:00'
  },
  {
    id: 'hall-3',
    name: '街道便民服务中心',
    address: '中山街88号',
    distance: 1.5,
    crowdLevel: 'green',
    crowdText: '空闲',
    waitTime: 5,
    windowCount: 6,
    openWindows: 5,
    tidalWindows: [],
    businessHours: '08:30-17:30'
  },
  {
    id: 'hall-4',
    name: '市民服务中心',
    address: '世纪大道100号',
    distance: 3.6,
    crowdLevel: 'red',
    crowdText: '拥挤',
    waitTime: 45,
    windowCount: 30,
    openWindows: 22,
    tidalWindows: [
      { windowNo: 'D01', serviceType: '公积金业务', status: 'open' },
      { windowNo: 'D02', serviceType: '公积金业务', status: 'open' },
      { windowNo: 'D03', serviceType: '公积金业务', status: 'open' },
      { windowNo: 'E01', serviceType: '医保业务', status: 'open' }
    ],
    businessHours: '09:00-17:30'
  },
  {
    id: 'hall-5',
    name: '开发区政务中心',
    address: '科技路200号',
    distance: 5.2,
    crowdLevel: 'yellow',
    crowdText: '适中',
    waitTime: 20,
    windowCount: 15,
    openWindows: 12,
    tidalWindows: [
      { windowNo: 'F01', serviceType: '企业注册', status: 'open' }
    ],
    businessHours: '09:00-17:00'
  }
];

export const getNearbyHalls = (): HallInfo[] => {
  return [...hallList].sort((a, b) => a.distance - b.distance);
};

export const getHallById = (id: string): HallInfo | undefined => {
  return hallList.find(hall => hall.id === id);
};
