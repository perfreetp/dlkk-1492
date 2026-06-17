import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { getNearbyHalls } from '@/data/halls';
import { HallInfo } from '@/types';
import { useAppStore } from '@/store';
import classnames from 'classnames';

const HomePage: React.FC = () => {
  const [nearbyHalls, setNearbyHalls] = useState<HallInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const bigFontMode = useAppStore(state => state.settings.bigFontMode);

  const quickActions = [
    { icon: '📱', text: '取号', color: '#e8f0ff', onClick: () => Taro.switchTab({ url: '/pages/queue/index' }) },
    { icon: '⏱️', text: '进度', color: '#e6fff2', onClick: () => Taro.switchTab({ url: '/pages/progress/index' }) },
    { icon: '📋', text: '材料', color: '#fff7e6', onClick: () => Taro.switchTab({ url: '/pages/queue/index' }) },
    { icon: '🔔', text: '提醒', color: '#ffebe8', onClick: () => Taro.switchTab({ url: '/pages/reminder/index' }) },
  ];

  const hotServices = [
    { icon: '🏠', name: '不动产' },
    { icon: '💳', name: '社保卡' },
    { icon: '📄', name: '身份证' },
    { icon: '💰', name: '公积金' },
    { icon: '🏥', name: '医保' },
    { icon: '👨‍👩‍👧', name: '户籍' },
    { icon: '🏢', name: '企业' },
    { icon: '➕', name: '更多' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useDidShow(() => {
    loadData();
  });

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      const halls = getNearbyHalls();
      setNearbyHalls(halls.slice(0, 3));
      setLoading(false);
    }, 500);
  };

  const getCrowdClass = (level: string) => {
    return classnames(styles.crowdBadge, {
      [styles.green]: level === 'green',
      [styles.yellow]: level === 'yellow',
      [styles.red]: level === 'red',
    });
  };

  const handleHallClick = (hall: HallInfo) => {
    Taro.switchTab({ url: '/pages/queue/index' });
  };

  const handleSearch = () => {
    Taro.switchTab({ url: '/pages/queue/index' });
  };

  const handleRefresh = () => {
    loadData();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  useEffect(() => {
    Taro.onPullDownRefresh(handleRefresh);
    return () => {
      Taro.offPullDownRefresh(handleRefresh);
    };
  }, []);

  const fs = bigFontMode ? { fontSize: '36rpx' } : {};
  const fsTitle = bigFontMode ? { fontSize: '40rpx' } : {};
  const fsDesc = bigFontMode ? { fontSize: '32rpx' } : {};

  return (
    <View className={classnames(styles.container, { [styles.bigFont]: bigFontMode })}>
      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.header}>
          <Text className={styles.greeting} style={fsTitle}>您好，欢迎使用政务服务</Text>
          <View className={styles.location}>
            <Text className={styles.locationIcon}>📍</Text>
            <Text style={fsDesc}>定位：人民路街道</Text>
          </View>
          <View className={styles.searchBar} onClick={handleSearch}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Text className={styles.searchText} style={fs}>搜索办事事项、大厅...</Text>
          </View>
        </View>

        <View className={styles.quickActions}>
          {quickActions.map((action, index) => (
            <View
              key={index}
              className={styles.actionItem}
              onClick={action.onClick}
            >
              <View
                className={styles.actionIcon}
                style={{ backgroundColor: action.color }}
              >
                <Text>{action.icon}</Text>
              </View>
              <Text className={styles.actionText} style={fs}>{action.text}</Text>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle} style={fsTitle}>附近大厅</Text>
            <Text className={styles.moreText} style={fsDesc}>查看全部 ›</Text>
          </View>

          {loading ? (
            <View className={styles.loading}>加载中...</View>
          ) : nearbyHalls.length === 0 ? (
            <View className={styles.emptyState}>暂无附近大厅数据</View>
          ) : (
            nearbyHalls.map((hall) => (
              <View
                key={hall.id}
                className={styles.hallCard}
                onClick={() => handleHallClick(hall)}
              >
                <View className={styles.hallHeader}>
                  <View>
                    <Text className={styles.hallName} style={fs}>{hall.name}</Text>
                    <Text className={styles.hallAddress} style={fsDesc}>{hall.address}</Text>
                  </View>
                  <View className={getCrowdClass(hall.crowdLevel)}>
                    {hall.crowdText}
                  </View>
                </View>

                <View className={styles.hallInfo}>
                  <View className={styles.infoItem}>
                    <Text className={styles.infoValue} style={fsTitle}>{hall.waitTime}</Text>
                    <Text className={styles.infoLabel} style={fsDesc}>预计等待(分)</Text>
                  </View>
                  <View className={styles.infoItem}>
                    <Text className={styles.infoValue} style={fs}>{hall.openWindows}/{hall.windowCount}</Text>
                    <Text className={styles.infoLabel} style={fsDesc}>开放窗口</Text>
                  </View>
                  <View className={styles.infoItem}>
                    <Text className={styles.infoValue} style={fsDesc}>{hall.businessHours}</Text>
                    <Text className={styles.infoLabel} style={fsDesc}>营业时间</Text>
                  </View>
                </View>

                <View className={styles.distance}>
                  <Text className={styles.distanceIcon}>🚶</Text>
                  <Text style={fsDesc}>距您 {hall.distance} 公里</Text>
                </View>

                {hall.tidalWindows.filter(w => w.status === 'open').length > 0 && (
                  <View className={styles.tidalSection}>
                    <View className={styles.tidalTitle}>
                      <Text className={styles.tidalIcon}>🌊</Text>
                      <Text style={fs}>当前开放潮汐窗口</Text>
                    </View>
                    <View className={styles.tidalList}>
                      {hall.tidalWindows
                        .filter(w => w.status === 'open')
                        .slice(0, 3)
                        .map((window, idx) => (
                          <View key={idx} className={styles.tidalItem}>
                            <Text className={styles.windowNo}>{window.windowNo}</Text>
                            <Text style={fsDesc}>{window.serviceType}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle} style={fsTitle}>热门服务</Text>
          </View>
          <View className={styles.hotServices}>
            {hotServices.map((service, index) => (
              <View
                key={index}
                className={styles.hotServiceItem}
                onClick={() => Taro.switchTab({ url: '/pages/queue/index' })}
              >
                <View className={styles.serviceIcon}>
                  <Text>{service.icon}</Text>
                </View>
                <Text className={styles.serviceName} style={fsDesc}>{service.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
};

export default HomePage;
