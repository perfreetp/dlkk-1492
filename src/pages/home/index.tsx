import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { getNearbyHalls, hallList } from '@/data/halls';
import { HallInfo } from '@/types';
import { useAppStore } from '@/store';
import classnames from 'classnames';

const HomePage: React.FC = () => {
  const [nearbyHalls, setNearbyHalls] = useState<HallInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const bigFontMode = useAppStore(state => state.settings.bigFontMode);
  const setSelectedHallId = useAppStore(state => state.setSelectedHallId);
  const currentQueue = useAppStore(state => state.currentQueue);

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

  const parseBusinessHours = (hours: string) => {
    const [startStr, endStr] = hours.split('-');
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0);
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em, 0);
    return { startTime, endTime };
  };

  const getBusinessStatus = (hall: HallInfo, walkMin: number) => {
    const { startTime, endTime } = parseBusinessHours(hall.businessHours);
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + walkMin * 60000);
    const finishTime = new Date(arrivalTime.getTime() + hall.waitTime * 60000);

    const isClosedNow = now < startTime || now > endTime;
    const willBeClosedOnArrival = arrivalTime > endTime;
    const willBeClosedBeforeFinish = finishTime > endTime;
    const minutesToClose = Math.round((endTime.getTime() - now.getTime()) / 60000);
    const nearClosing = minutesToClose > 0 && minutesToClose < hall.waitTime + walkMin + 15;

    let status: 'open' | 'closed' | 'nearClosing' = 'open';
    let reason = '';

    if (isClosedNow) {
      status = 'closed';
      reason = '已休息';
    } else if (willBeClosedOnArrival) {
      status = 'closed';
      reason = '到达时已下班';
    } else if (nearClosing || willBeClosedBeforeFinish) {
      status = 'nearClosing';
      reason = `剩 ${minutesToClose} 分下班`;
    }

    return { status, reason, minutesToClose, arrivalTime, finishTime };
  };

  const calculateScore = (hall: HallInfo) => {
    const walkMin = Math.round(hall.distance * 15);
    const biz = getBusinessStatus(hall, walkMin);

    if (biz.status === 'closed') return -999;

    let score = 100;
    score -= hall.distance * 5;
    const crowdPenalty: Record<string, number> = { green: 0, yellow: 15, red: 35 };
    score -= crowdPenalty[hall.crowdLevel] || 0;
    score -= hall.waitTime * 0.5;

    if (biz.status === 'nearClosing') {
      score -= 50;
    }
    return score;
  };

  const recommendedHall = useMemo(() => {
    if (nearbyHalls.length === 0) return null;
    const scored = nearbyHalls
      .map(h => ({ hall: h, score: calculateScore(h) }))
      .filter(x => x.score > -900);
    if (scored.length === 0) return null;
    scored.sort((a, b) => b.score - a.score);
    return scored[0].hall;
  }, [nearbyHalls]);

  const formatTime = (date: Date) => {
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const getHallTimeInfo = (hall: HallInfo) => {
    const walkMin = Math.round(hall.distance * 15);
    const biz = getBusinessStatus(hall, walkMin);
    const walkText = walkMin > 60
      ? `${Math.floor(walkMin / 60)}小时${walkMin % 60}分`
      : `${walkMin}分钟`;
    return {
      walkText,
      arrivalText: `${walkText} (${formatTime(biz.arrivalTime)})`,
      canFinishText: biz.status === 'closed' ? '已休息无法办理' : `预计 ${formatTime(biz.finishTime)} 能办上`,
      bizStatus: biz.status,
      bizReason: biz.reason,
    };
  };

  const getRecommendation = (hall: HallInfo) => {
    const { waitTime, crowdLevel, distance } = hall;
    const walkMin = Math.round(distance * 15);
    const biz = getBusinessStatus(hall, walkMin);

    if (biz.status === 'closed') {
      return { text: biz.reason, level: 'bad', icon: '🚫' };
    }
    if (biz.status === 'nearClosing') {
      return { text: biz.reason + '，建议明天再来', level: 'bad', icon: '🌙' };
    }
    if (crowdLevel === 'green' && waitTime <= 15 && distance <= 2) {
      return { text: '非常适合现在去', level: 'great', icon: '✅' };
    }
    if (crowdLevel === 'red' || waitTime > 40) {
      return { text: '建议稍后再去', level: 'bad', icon: '⚠️' };
    }
    if (distance > 4) {
      return { text: '距离较远，可考虑就近', level: 'normal', icon: '📍' };
    }
    return { text: '现在去合适', level: 'normal', icon: '👍' };
  };

  const handleHallClick = (hall: HallInfo) => {
    setSelectedHallId(hall.id);
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

        {!loading && recommendedHall && (
          <View className={styles.recommendSection}>
            <View className={styles.recommendCard}>
              <View className={styles.recommendHeader}>
                <View className={styles.recommendTitleRow}>
                  <Text className={styles.recommendIcon}>💡</Text>
                  <Text className={styles.recommendTitle} style={fsTitle}>现在去合不合适？</Text>
                </View>
                <View className={classnames(styles.recommendBadge, styles[getRecommendation(recommendedHall).level])}>
                  {getRecommendation(recommendedHall).icon} {getRecommendation(recommendedHall).text}
                </View>
              </View>

              <View className={styles.recommendBody}>
                <View className={styles.recommendHall}>
                  <Text className={styles.hallName} style={fs}>{recommendedHall.name}</Text>
                  <View className={getCrowdClass(recommendedHall.crowdLevel)}>
                    {recommendedHall.crowdText}
                  </View>
                </View>

                <View className={styles.recommendStats}>
                  <View className={styles.recItem}>
                    <Text className={styles.recValue} style={fsTitle}>{recommendedHall.waitTime}</Text>
                    <Text className={styles.recLabel} style={fsDesc}>预计等待(分)</Text>
                  </View>
                  <View className={styles.recItem}>
                    <Text className={styles.recValue} style={fs}>{recommendedHall.distance}km</Text>
                    <Text className={styles.recLabel} style={fsDesc}>步行 {getHallTimeInfo(recommendedHall).arrivalText}</Text>
                  </View>
                  <View className={styles.recItem}>
                    <Text className={styles.recValue} style={fs}>{recommendedHall.openWindows}</Text>
                    <Text className={styles.recLabel} style={fsDesc}>开放窗口</Text>
                  </View>
                </View>

                <View className={styles.canFinishRow}>
                  <Text className={styles.clockIcon}>🕐</Text>
                  <Text className={styles.canFinishText} style={fs}>{getHallTimeInfo(recommendedHall).canFinishText}</Text>
                </View>

                <View
                  className={styles.recommendBtn}
                  onClick={() => handleHallClick(recommendedHall)}
                >
                  <Text style={fs}>去这里取号 →</Text>
                </View>
              </View>
            </View>
          </View>
        )}

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
            nearbyHalls.map((hall) => {
              const hallTimeInfo = getHallTimeInfo(hall);
              const isHallClosed = hallTimeInfo.bizStatus === 'closed';
              return (
                <View
                  key={hall.id}
                  className={classnames(styles.hallCard, { [styles.hallClosed]: isHallClosed })}
                  onClick={() => !isHallClosed && handleHallClick(hall)}
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
                      <Text className={styles.infoLabel} style={fsDesc}>
                        {isHallClosed ? `⚠️ ${hallTimeInfo.bizReason}` : '营业时间'}
                      </Text>
                    </View>
                  </View>

                  <View className={styles.hallFooter}>
                    <View className={styles.distance}>
                      <Text className={styles.distanceIcon}>🚶</Text>
                      <Text style={fsDesc}>距您 {hall.distance} 公里 · {hallTimeInfo.arrivalText}</Text>
                    </View>
                    {!isHallClosed && (
                      <View className={styles.finishTag}>
                        <Text style={fsDesc}>{hallTimeInfo.canFinishText}</Text>
                      </View>
                    )}
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
              );
            })
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
