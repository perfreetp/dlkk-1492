import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { getHallById } from '@/data/halls';
import { QueueInfo, HallInfo } from '@/types';
import { useAppStore } from '@/store';
import classnames from 'classnames';

const ProgressPage: React.FC = () => {
  const storeQueue = useAppStore(state => state.currentQueue);
  const queueCancelled = useAppStore(state => state.queueCancelled);
  const hasRequeuedStore = useAppStore(state => state.hasRequeued);
  const cancelQueue = useAppStore(state => state.cancelQueue);
  const requeueStore = useAppStore(state => state.requeue);
  const bigFontMode = useAppStore(state => state.settings.bigFontMode);

  const [hall, setHall] = useState<HallInfo | null>(null);
  const [showRequeueModal, setShowRequeueModal] = useState<boolean>(false);

  useEffect(() => {
    if (storeQueue) {
      const h = getHallById(storeQueue.hallId);
      setHall(h || null);
    } else {
      setHall(null);
    }
  }, [storeQueue]);

  const handleRefresh = () => {
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

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      waiting: '排队等待中',
      calling: '正在叫号',
      processing: '办理中',
      completed: '已完成',
      passed: '已过号'
    };
    return statusMap[status] || status;
  };

  const getProgressPercent = () => {
    if (!storeQueue) return 0;
    const total = storeQueue.aheadCount + 1;
    const served = 1;
    return Math.min(Math.round((served / total) * 100), 100);
  };

  const handleRequeue = () => {
    if (hasRequeuedStore) {
      Taro.showToast({
        title: '已使用过重排机会',
        icon: 'none'
      });
      return;
    }
    setShowRequeueModal(true);
  };

  const confirmRequeue = () => {
    if (storeQueue) {
      const updated: QueueInfo = {
        ...storeQueue,
        aheadCount: storeQueue.aheadCount + 5,
        waitTime: storeQueue.waitTime + 10,
        status: 'waiting'
      };
      requeueStore(updated);
      setShowRequeueModal(false);
      Taro.showToast({
        title: '重排成功',
        icon: 'success'
      });
    }
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消当前排队号吗？',
      success: (res) => {
        if (res.confirm) {
          cancelQueue();
          Taro.showToast({
            title: '已取消',
            icon: 'success'
          });
        }
      }
    });
  };

  const handleNavigate = () => {
    Taro.showToast({
      title: '正在打开地图...',
      icon: 'none'
    });
  };

  const fs = bigFontMode ? { fontSize: '36rpx' } : {};
  const fsLg = bigFontMode ? { fontSize: '44rpx' } : {};
  const fsDesc = bigFontMode ? { fontSize: '32rpx' } : {};

  if (queueCancelled || !storeQueue) {
    return (
      <View className={classnames(styles.container, { [styles.bigFont]: bigFontMode })}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle} style={fsLg}>
            {queueCancelled ? '排队已取消' : '暂无排队中的号码'}
          </Text>
          <Text className={styles.emptyDesc} style={fsDesc}>
            {queueCancelled ? '如需办理请重新取号' : '去取号，开启高效办事体验'}
          </Text>
          <View
            className={styles.emptyBtn}
            onClick={() => Taro.switchTab({ url: '/pages/queue/index' })}
          >
            立即取号
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={classnames(styles.container, { [styles.bigFont]: bigFontMode })}>
      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.headerCard}>
          <View style={{ textAlign: 'center', marginBottom: '16rpx' }}>
            <View className={classnames(styles.statusBadge, styles[storeQueue.status])}>
              {getStatusText(storeQueue.status)}
            </View>
          </View>

          <View className={styles.queueNumber}>
            <Text className={styles.label} style={fsDesc}>您的号码</Text>
            <Text className={styles.number} style={bigFontMode ? { fontSize: '120rpx' } : {}}>{storeQueue.queueNumber}</Text>
          </View>

          <View className={styles.serviceInfo}>
            <Text className={styles.serviceName} style={fs}>{storeQueue.serviceName}</Text>
            <Text className={styles.hallName} style={fsDesc}>{storeQueue.hallName}</Text>
          </View>

          <View className={styles.progressStats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{storeQueue.aheadCount}</Text>
              <Text className={styles.statLabel}>前方等待</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{storeQueue.waitTime}</Text>
              <Text className={styles.statLabel}>预计等待(分)</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{hall?.openWindows || 0}</Text>
              <Text className={styles.statLabel}>开放窗口</Text>
            </View>
          </View>

          <View className={styles.voiceTip}>
            <Text className={styles.voiceIcon}>🔊</Text>
            <Text className={styles.voiceText}>开启语音播报，叫号时自动提醒</Text>
          </View>
        </View>

        {storeQueue.status === 'calling' && (
          <View className={styles.section}>
            <View className={styles.currentNumber}>
              <Text className={styles.label}>当前正在叫号</Text>
              <Text className={styles.number}>{storeQueue.currentNumber}</Text>
              {storeQueue.windowNo && (
                <Text className={styles.window}>请前往 {storeQueue.windowNo} 窗口</Text>
              )}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📊</Text>
            <Text>排队进度</Text>
          </View>

          <View className={styles.progressBar}>
            <View className={styles.barTrack}>
              <View
                className={styles.barFill}
                style={{ width: `${getProgressPercent()}%` }}
              />
            </View>
            <View className={styles.barLabels}>
              <Text>取号</Text>
              <Text>办理中</Text>
            </View>
          </View>

          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>取号时间</Text>
              <Text className={styles.infoValue}>{storeQueue.takeTime}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>预计叫号</Text>
              <Text className={styles.infoValue}>{storeQueue.estimatedCallTime}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>当前叫到</Text>
              <Text className={styles.infoValue}>{storeQueue.currentNumber}</Text>
            </View>
            {storeQueue.windowNo && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>办理窗口</Text>
                <Text className={styles.infoValue}>{storeQueue.windowNo}</Text>
              </View>
            )}
          </View>

          {!storeQueue.materialsReady && storeQueue.missingMaterials && storeQueue.missingMaterials.length > 0 && (
            <View className={styles.materialWarning}>
              <View className={styles.warningTitle}>
                <Text className={styles.warningIcon}>⚠️</Text>
                <Text>材料提醒</Text>
              </View>
              <Text className={styles.warningText}>
                您可能缺少：{storeQueue.missingMaterials.join('、')}，请提前准备好相关材料，避免影响办理。
              </Text>
            </View>
          )}
        </View>

        {hall && hall.tidalWindows.filter(w => w.status === 'open').length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>🌊</Text>
              <Text>潮汐窗口</Text>
            </View>
            <View className={styles.tidalInfo}>
              {hall.tidalWindows
                .filter(w => w.status === 'open')
                .map((window, idx) => (
                  <View key={idx} className={styles.tidalItem}>
                    <View className={styles.windowNo}>{window.windowNo}</View>
                    <Text className={styles.windowType}>{window.serviceType}</Text>
                    <Text className={styles.windowStatus}>开放中</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.actionButtons}>
            {storeQueue.status === 'passed' ? (
              <View
                className={classnames(styles.actionBtn, styles.warning, {
                  [styles.disabled]: hasRequeuedStore
                })}
                onClick={handleRequeue}
              >
                {hasRequeuedStore ? '已重排' : '申请重排'}
              </View>
            ) : (
              <>
                <View
                  className={classnames(styles.actionBtn, styles.secondary)}
                  onClick={handleNavigate}
                >
                  导航前往
                </View>
                <View
                  className={classnames(styles.actionBtn, styles.primary)}
                  onClick={() => Taro.switchTab({ url: '/pages/reminder/index' })}
                >
                  提醒设置
                </View>
              </>
            )}
          </View>

          {storeQueue.status === 'waiting' && (
            <View style={{ marginTop: '24rpx' }}>
              <View
                className={classnames(styles.actionBtn, styles.secondary)}
                onClick={handleCancel}
                style={{ width: '100%' }}
              >
                取消取号
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {showRequeueModal && storeQueue && (
        <View className={styles.modalOverlay} onClick={() => setShowRequeueModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.requeueModal}>
              <Text className={styles.requeueTitle}>申请过号重排</Text>
              <Text className={styles.requeueDesc}>
                每个号码可申请一次过号重排，重排后将排在当前队列后5位。
              </Text>

              <View className={styles.requeueInfo}>
                <View className={styles.infoRow}>
                  <Text className={styles.label}>原号码</Text>
                  <Text className={styles.value}>{storeQueue.queueNumber}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.label}>原前方人数</Text>
                  <Text className={styles.value}>{storeQueue.aheadCount} 人</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.label}>重排后前方</Text>
                  <Text className={styles.value}>{storeQueue.aheadCount + 5} 人</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.label}>预计等待</Text>
                  <Text className={styles.value}>{storeQueue.waitTime + 10} 分钟</Text>
                </View>
              </View>

              <View className={styles.requeueWarning}>
                ⚠️ 注意：本次重排后将无法再次申请，请留意叫号。
              </View>

              <View className={styles.modalFooter}>
                <View className={styles.cancelBtn} onClick={() => setShowRequeueModal(false)}>
                  取消
                </View>
                <View className={styles.confirmBtn} onClick={confirmRequeue}>
                  确认重排
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProgressPage;
