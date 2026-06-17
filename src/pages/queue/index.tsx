import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { serviceCategories, getServicesByCategory, searchServices } from '@/data/services';
import { hallList } from '@/data/halls';
import { mockTakeNumber } from '@/data/queue';
import { ServiceItem, HallInfo, QueueInfo } from '@/types';
import { useAppStore } from '@/store';
import classnames from 'classnames';

const QueuePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [serviceList, setServiceList] = useState<ServiceItem[]>([]);
  const [selectedHall, setSelectedHall] = useState<HallInfo | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showHallModal, setShowHallModal] = useState<boolean>(false);
  const [showServiceDetail, setShowServiceDetail] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [newQueue, setNewQueue] = useState<QueueInfo | null>(null);

  const setQueue = useAppStore(state => state.setQueue);
  const selectedHallId = useAppStore(state => state.selectedHallId);
  const setSelectedHallIdStore = useAppStore(state => state.setSelectedHallId);

  useEffect(() => {
    loadServices();
    if (selectedHallId) {
      const hall = hallList.find(h => h.id === selectedHallId);
      if (hall) {
        setSelectedHall(hall);
        return;
      }
    }
    if (hallList.length > 0) {
      setSelectedHall(hallList[0]);
    }
  }, [selectedHallId]);

  useEffect(() => {
    if (selectedHall) {
      setSelectedHallIdStore(selectedHall.id);
    }
  }, [selectedHall, setSelectedHallIdStore]);

  const loadServices = () => {
    let services;
    if (searchKeyword) {
      services = searchServices(searchKeyword);
    } else {
      services = getServicesByCategory(activeCategory);
    }
    setServiceList(services);
  };

  useEffect(() => {
    loadServices();
  }, [activeCategory, searchKeyword]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleSearch = (e: any) => {
    setSearchKeyword(e.detail.value);
  };

  const handleServiceClick = (service: ServiceItem) => {
    setSelectedService(service);
    setShowServiceDetail(true);
  };

  const handleHallSelect = (hall: HallInfo) => {
    setSelectedHall(hall);
    setShowHallModal(false);
  };

  const getCrowdClass = (level: string) => {
    return classnames(styles.crowdBadge, {
      [styles.green]: level === 'green',
      [styles.yellow]: level === 'yellow',
      [styles.red]: level === 'red',
    });
  };

  const handleTakeNumber = () => {
    if (!selectedHall || !selectedService) {
      Taro.showToast({
        title: '请先选择大厅和事项',
        icon: 'none'
      });
      return;
    }

    const queueInfo = mockTakeNumber(selectedHall.id, selectedService.name);
    setNewQueue(queueInfo);
    setQueue(queueInfo);
    setShowServiceDetail(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      Taro.switchTab({ url: '/pages/progress/index' });
    }, 2000);
  };

  const closeServiceDetail = () => {
    setShowServiceDetail(false);
    setSelectedService(null);
  };

  return (
    <View className={styles.container}>
      <View className={styles.searchSection}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索办事事项..."
            placeholderTextColor="#86909c"
            value={searchKeyword}
            onInput={handleSearch}
          />
        </View>
      </View>

      <ScrollView scrollX className={styles.categoryTabs} enhanced showScrollbar={false}>
        {serviceCategories.map((category) => (
          <View
            key={category.id}
            className={classnames(styles.tabItem, {
              [styles.active]: activeCategory === category.id
            })}
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.name}
          </View>
        ))}
      </ScrollView>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择办事大厅</Text>
        <View
          className={styles.hallSelector}
          onClick={() => setShowHallModal(true)}
        >
          <View className={styles.hallInfo}>
            <Text className={styles.hallName}>
              {selectedHall?.name || '请选择大厅'}
            </Text>
            <Text className={styles.hallMeta}>
              {selectedHall?.address || ''}
            </Text>
          </View>
          {selectedHall && (
            <View className={getCrowdClass(selectedHall.crowdLevel)}>
              {selectedHall.crowdText}
            </View>
          )}
          <Text className={styles.arrow}>›</Text>
        </View>
        {selectedHall && (
          <Text style={{ fontSize: '24rpx', color: '#86909c' }}>
            预计等待 {selectedHall.waitTime} 分钟 · {selectedHall.openWindows}/{selectedHall.windowCount} 个窗口开放
          </Text>
        )}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择办事事项</Text>
      </View>

      <View className={styles.serviceList}>
        {serviceList.length === 0 ? (
          <View className={styles.emptyState}>暂无相关事项</View>
        ) : (
          serviceList.map((service) => (
            <View
              key={service.id}
              className={styles.serviceItem}
              onClick={() => handleServiceClick(service)}
            >
              <View className={styles.serviceHeader}>
                <Text className={styles.serviceName}>{service.name}</Text>
                <View
                  className={classnames(styles.previewBadge, {
                    [styles.noPreview]: !service.supportOnlinePreview
                  })}
                >
                  {service.supportOnlinePreview ? '支持预审' : '不支持预审'}
                </View>
              </View>
              <Text className={styles.serviceDesc}>{service.description}</Text>
              <View className={styles.serviceMeta}>
                <View className={styles.metaItem}>
                  <Text className={styles.metaIcon}>⏱️</Text>
                  <Text>办理约{service.avgHandleTime}分钟</Text>
                </View>
                <View className={styles.metaItem}>
                  <Text className={styles.metaIcon}>📋</Text>
                  <Text>需{service.requiredMaterials.length}份材料</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {selectedService && showServiceDetail && (
        <View className={styles.modalOverlay} onClick={closeServiceDetail}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>{selectedService.name}</Text>
              <Text className={styles.closeBtn} onClick={closeServiceDetail}>✕</Text>
            </View>
            <View className={styles.modalBody}>
              <Text style={{ fontSize: '28rpx', color: '#4e5969', marginBottom: '24rpx' }}>
                {selectedService.description}
              </Text>

              <View style={{ marginBottom: '24rpx' }}>
                <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#1d2129', marginBottom: '16rpx' }}>
                  所需材料
                </Text>
                <View className={styles.materialList}>
                  {selectedService.requiredMaterials.map((material, idx) => (
                    <View key={idx} className={styles.materialItem}>
                      <Text className={styles.materialIcon}>📄</Text>
                      <Text>{material}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: '24rpx' }}>
                <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#1d2129', marginBottom: '16rpx' }}>
                  办理信息
                </Text>
                <View style={{ fontSize: '26rpx', color: '#4e5969', lineHeight: 1.8 }}>
                  <Text>• 平均办理时长：{selectedService.avgHandleTime} 分钟</Text>
                  <Text>{'\n'}</Text>
                  <Text>• 线上预审：{selectedService.supportOnlinePreview ? '支持' : '不支持'}</Text>
                </View>
              </View>

              {selectedHall && (
                <View style={{ background: '#e8f0ff', padding: '24rpx', borderRadius: '12rpx' }}>
                  <Text style={{ fontSize: '26rpx', color: '#165dff', fontWeight: 500 }}>
                    📍 {selectedHall.name}
                  </Text>
                  <Text style={{ fontSize: '24rpx', color: '#4e5969', marginTop: '8rpx' }}>
                    预计等待 {selectedHall.waitTime} 分钟 · {selectedHall.distance} 公里
                  </Text>
                </View>
              )}
            </View>
            <View className={styles.modalFooter}>
              <View className={styles.cancelBtn} onClick={closeServiceDetail}>
                取消
              </View>
              <View className={styles.confirmBtn} onClick={handleTakeNumber}>
                立即取号
              </View>
            </View>
          </View>
        </View>
      )}

      {showHallModal && (
        <View className={styles.modalOverlay} onClick={() => setShowHallModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择办事大厅</Text>
              <Text className={styles.closeBtn} onClick={() => setShowHallModal(false)}>✕</Text>
            </View>
            <View className={styles.modalBody}>
              {hallList.map((hall) => (
                <View
                  key={hall.id}
                  className={classnames(styles.hallOption, {
                    [styles.selected]: selectedHall?.id === hall.id
                  })}
                  onClick={() => handleHallSelect(hall)}
                >
                  <Text className={styles.hallName}>{hall.name}</Text>
                  <View className={styles.hallInfo}>
                    <Text>{hall.distance}公里</Text>
                    <Text>等待{hall.waitTime}分钟</Text>
                    <View className={getCrowdClass(hall.crowdLevel)} style={{ fontSize: '20rpx' }}>
                      {hall.crowdText}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {showSuccess && newQueue && (
        <View className={styles.modalOverlay}>
          <View className={styles.modalContent} style={{ textAlign: 'center' }}>
            <View style={{ padding: '48rpx' }}>
              <Text style={{ fontSize: '80rpx' }}>✅</Text>
              <Text style={{
                fontSize: '32rpx',
                fontWeight: 600,
                color: '#1d2129',
                marginBottom: '16rpx',
                marginTop: '24rpx',
                display: 'block'
              }}>
                取号成功！
              </Text>
              <Text style={{
                fontSize: '56rpx',
                fontWeight: 'bold',
                color: '#165dff',
                marginBottom: '16rpx',
                display: 'block'
              }}>
                {newQueue.queueNumber}
              </Text>
              <Text style={{ fontSize: '26rpx', color: '#4e5969' }}>
                前方 {newQueue.aheadCount} 人 · 预计等待 {newQueue.waitTime} 分钟
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={styles.selectedInfo}>
          <Text className={styles.label}>已选择</Text>
          <Text className={styles.value}>
            {selectedService?.name || '请选择事项'}
          </Text>
        </View>
        <View
          className={classnames(styles.confirmButton, {
            [styles.disabled]: !selectedService || !selectedHall
          })}
          onClick={handleTakeNumber}
        >
          立即取号
        </View>
      </View>
    </View>
  );
};

export default QueuePage;
