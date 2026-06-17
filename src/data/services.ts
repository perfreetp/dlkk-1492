import { ServiceItem } from '@/types';

export const serviceCategories = [
  { id: 'all', name: '全部' },
  { id: 'social', name: '社保医保' },
  { id: 'house', name: '不动产' },
  { id: 'household', name: '户籍证件' },
  { id: 'business', name: '企业服务' },
  { id: 'fund', name: '公积金' }
];

export const serviceList: ServiceItem[] = [
  {
    id: 's1',
    name: '社保卡办理',
    category: 'social',
    supportOnlinePreview: true,
    requiredMaterials: ['身份证原件', '近期一寸照片', '户口本'],
    avgHandleTime: 15,
    description: '新办、补办社保卡，立等可取'
  },
  {
    id: 's2',
    name: '医保报销',
    category: 'social',
    supportOnlinePreview: true,
    requiredMaterials: ['身份证', '医保卡', '医疗费用发票', '诊断证明', '费用清单'],
    avgHandleTime: 20,
    description: '门诊、住院医疗费用报销'
  },
  {
    id: 's3',
    name: '不动产登记',
    category: 'house',
    supportOnlinePreview: true,
    requiredMaterials: ['身份证', '户口本', '购房合同', '发票', '完税证明'],
    avgHandleTime: 30,
    description: '房屋所有权首次登记、转移登记'
  },
  {
    id: 's4',
    name: '房产证补办',
    category: 'house',
    supportOnlinePreview: false,
    requiredMaterials: ['身份证', '户口本', '房屋档案查询证明'],
    avgHandleTime: 25,
    description: '不动产权证书遗失补发'
  },
  {
    id: 's5',
    name: '户口迁移',
    category: 'household',
    supportOnlinePreview: true,
    requiredMaterials: ['身份证', '户口本', '迁移证', '房产证或租房合同'],
    avgHandleTime: 15,
    description: '市内户口迁移、投靠迁移'
  },
  {
    id: 's6',
    name: '身份证办理',
    category: 'household',
    supportOnlinePreview: false,
    requiredMaterials: ['户口本', '原身份证（换证）'],
    avgHandleTime: 10,
    description: '首次申领、换领、补领居民身份证'
  },
  {
    id: 's7',
    name: '营业执照办理',
    category: 'business',
    supportOnlinePreview: true,
    requiredMaterials: ['身份证', '经营场所证明', '公司章程', '名称预先核准通知书'],
    avgHandleTime: 20,
    description: '个体工商户、公司设立登记'
  },
  {
    id: 's8',
    name: '公积金提取',
    category: 'fund',
    supportOnlinePreview: true,
    requiredMaterials: ['身份证', '公积金卡', '购房合同或租房合同', '发票'],
    avgHandleTime: 15,
    description: '购房提取、租房提取、离职提取'
  },
  {
    id: 's9',
    name: '公积金贷款',
    category: 'fund',
    supportOnlinePreview: true,
    requiredMaterials: ['身份证', '户口本', '收入证明', '购房合同', '首付款发票'],
    avgHandleTime: 30,
    description: '住房公积金个人住房贷款'
  },
  {
    id: 's10',
    name: '社保转移',
    category: 'social',
    supportOnlinePreview: false,
    requiredMaterials: ['身份证', '社保卡', '转移接续申请表'],
    avgHandleTime: 10,
    description: '养老保险、医疗保险关系转移接续'
  },
  {
    id: 's11',
    name: '出生登记',
    category: 'household',
    supportOnlinePreview: true,
    requiredMaterials: ['父母身份证', '结婚证', '出生医学证明', '户口本'],
    avgHandleTime: 10,
    description: '新生儿户口登记'
  },
  {
    id: 's12',
    name: '税务登记',
    category: 'business',
    supportOnlinePreview: false,
    requiredMaterials: ['营业执照', '身份证', '公章', '银行开户许可证'],
    avgHandleTime: 15,
    description: '新办企业税务报到、税种核定'
  }
];

export const getServicesByCategory = (category: string): ServiceItem[] => {
  if (category === 'all') return serviceList;
  return serviceList.filter(s => s.category === category);
};

export const searchServices = (keyword: string): ServiceItem[] => {
  const lowerKeyword = keyword.toLowerCase();
  return serviceList.filter(s => 
    s.name.toLowerCase().includes(lowerKeyword) ||
    s.description.toLowerCase().includes(lowerKeyword)
  );
};

export const getServiceById = (id: string): ServiceItem | undefined => {
  return serviceList.find(s => s.id === id);
};
