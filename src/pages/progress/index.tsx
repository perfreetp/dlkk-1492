import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useDidHide } from '@tarojs/taro';
import styles from './index.module.scss';
import { getHallById } from '@/data/halls';
import { QueueInfo, HallInfo } from '@/types';
import { useAppStore } from '@/store';
import { speak } from '@/utils/speech';
import { storageKeys, getStorage, setStorage } from '@/utils/storage';
import classnames from 'classnames';

const ProgressPage: React.FC = () => {
  const storeQueue = useAppStore(state => state.currentQueue);
  const queueCancelled = useAppStore(state => state.queueCancelled);
  const hasRequeuedStore = useAppStore(state => state.hasRequeued);
  const cancelQueue = useAppStore(state => state.cancelQueue);
  const requeueStore = useAppStore(state => state.requeue);
  const updateQueue = useAppStore(state => state.updateQueue);
  const addRecord = useAppStore(state => state.addRecord);
  const updateRecordStatus = useAppStore(state => state.updateRecordStatus);
  const bigFontMode = useAppStore(state => state.settings.bigFontMode);
  const voiceEnabled = useAppStore(state => state.settings.voiceEnabled);

  const [hall, setHall] = useState<HallInfo | null>(null);
  const [showRequeueModal, setShowRequeueModal] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const callingTimerRef = useRef<number | null>(null);
  const lastSpeakKeyRef = useRef<string>('');

  useEffect(() => {
    if (storeQueue) {
      const h = getHallById(storeQueue.hallId);
      setHall(h || null);
    } else {
      setHall(null);
    }
  }, [storeQueue]);

  const parseQueueNumber = (numStr: string) => {
    const match = numStr.match(/^([A-Z])(\d+)$/);
    if (match) {
      return { prefix: match[1], num: parseInt(match[2], 10) };
    }
    return { prefix: 'A', num: 0 };
  };

  const formatQueueNumber = (prefix: string, num: number) => {
    return `${prefix}${num.toString().padStart(4, '0')}`;
  };

  const checkAndSpeak = useCallback((queue: QueueInfo) => {
    if (!voiceEnabled) return;

    const status = queue.status;
    const aheadCount = queue.aheadCount;
    const queueId = queue.id;

    const currentKey = `${queueId}_${status}_${aheadCount <= 3 ? 'near' : 'far'}_${aheadCount}`;
    if (lastSpeakKeyRef.current === currentKey) return;

    const storedKey = getStorage<string>(storageKeys.hasSpoken, '');
    if (storedKey === currentKey) {
      lastSpeakKeyRef.current = currentKey;
      return;
    }

    let text = '';
    let speakType: 'normal' | 'calling' | 'warning' = 'normal';
    if (status === 'calling') {
      text = `请${queue.queueNumber}号，前往${queue.windowNo || '指定'}窗口办理${queue.serviceName}业务，地点在${queue.hallName}。请${queue.queueNumber}号，前往${queue.windowNo || '指定'}窗口办理${queue.serviceName}业务。`;
      speakType = 'calling';
    } else if (status === 'passed') {
      text = `注意，您的号码${queue.queueNumber}已过号。请${queue.queueNumber}号尽快前往${queue.hallName}${queue.windowNo || '咨询台'}申请过号重排。您的号码${queue.queueNumber}所办事项是${queue.serviceName}。`;
      speakType = 'warning';
    } else if (status === 'waiting' && aheadCount <= 3 && aheadCount >= 0) {
      text = `温馨提示，您的号码${queue.queueNumber}前方还有${aheadCount}人，预计等待${queue.waitTime}分钟。办理地点是${queue.hallName}，业务是${queue.serviceName}，请注意叫号。`;
      speakType = 'warning';
    }

    if (text) {
      speak(text, { type: speakType });
      setStorage(storageKeys.hasSpoken, currentKey);
      lastSpeakKeyRef.current = currentKey;
    }
  }, [voiceEnabled]);

  const clearCallingTimer = () => {
    if (callingTimerRef.current) {
      Taro.clearTimeout(callingTimerRef.current);
      callingTimerRef.current = null;
    }
  };

  const handlePassed = useCallback(() => {
    if (!storeQueue) return;
    const passedUpdates: Partial<QueueInfo> = {
      status: 'passed',
    };
    updateQueue(passedUpdates);
    checkAndSpeak({ ...storeQueue, ...passedUpdates } as QueueInfo);

    const now = new Date();
    const passTime = now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const recordId = `rec-${storeQueue.id}`;
    const records = useAppStore.getState().records;
    const existing = records.find(r => r.id === recordId);
    if (existing) {
      updateRecordStatus(recordId, 'passed', {
        completeTime: passTime,
        windowNo: storeQueue.windowNo,
      });
    } else {
      addRecord({
        id: recordId,
        hallName: storeQueue.hallName,
        serviceName: storeQueue.serviceName,
        queueNumber: storeQueue.queueNumber,
        takeTime: storeQueue.takeTime,
        completeTime: passTime,
        status: 'passed',
        windowNo: storeQueue.windowNo,
      });
    }
  }, [storeQueue, updateQueue, checkAndSpeak, updateRecordStatus, addRecord]);

  const handleCompleted = useCallback(() => {
    if (!storeQueue) return;
    const completeUpdates: Partial<QueueInfo> = {
      status: 'completed',
    };
    updateQueue(completeUpdates);

    const now = new Date();
    const completeTime = now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const recordId = `rec-${storeQueue.id}`;
    const records = useAppStore.getState().records;
    const existing = records.find(r => r.id === recordId);
    if (existing) {
      updateRecordStatus(recordId, 'completed', {
        completeTime,
        windowNo: storeQueue.windowNo,
      });
    } else {
      addRecord({
        id: recordId,
        hallName: storeQueue.hallName,
        serviceName: storeQueue.serviceName,
        queueNumber: storeQueue.queueNumber,
        takeTime: storeQueue.takeTime,
        completeTime,
        status: 'completed',
        windowNo: storeQueue.windowNo,
      });
    }
  }, [storeQueue, updateQueue, updateRecordStatus, addRecord]);

  const advanceQueue = useCallback(() => {
    if (!storeQueue) return;
    if (storeQueue.status === 'completed' || storeQueue.status === 'passed') return;
    if (storeQueue.status === 'processing') return;

    const { prefix, num: myNum } = parseQueueNumber(storeQueue.queueNumber);
    const { num: curNum } = parseQueueNumber(storeQueue.currentNumber);
    const nextCurNum = curNum + 1;
    const newAhead = Math.max(0, myNum - nextCurNum);
    const newWaitTime = Math.max(0, Math.round(newAhead * 1.5));

    if (storeQueue.status === 'waiting') {
      if (nextCurNum >= myNum) {
        const windowNo = storeQueue.windowNo || `${prefix}0${Math.floor(Math.random() * 5) + 1}`;
        const updated: Partial<QueueInfo> = {
          status: 'calling',
          currentNumber: formatQueueNumber(prefix, nextCurNum),
          aheadCount: 0,
          waitTime: 0,
          windowNo,
        };
        updateQueue(updated);
        checkAndSpeak({ ...storeQueue, ...updated } as QueueInfo);

        clearCallingTimer();
        callingTimerRef.current = Taro.setTimeout(() => {
          const state = useAppStore.getState();
          if (state.currentQueue?.status === 'calling') {
            handlePassed();
          }
        }, 24000) as unknown as number;
      } else {
        const updated: Partial<QueueInfo> = {
          currentNumber: formatQueueNumber(prefix, nextCurNum),
          aheadCount: newAhead,
          waitTime: newWaitTime,
        };
        updateQueue(updated);
        checkAndSpeak({ ...storeQueue, ...updated } as QueueInfo);
      }
    }
  }, [storeQueue, updateQueue, checkAndSpeak, handlePassed]);

  useEffect(() => {
    if (!storeQueue || storeQueue.status === 'completed' || storeQueue.status === 'passed' || queueCancelled) {
      if (timerRef.current) {
        Taro.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      clearCallingTimer();
      return;
    }

    timerRef.current = Taro.setInterval(() => {
      advanceQueue();
    }, 8000) as unknown as number;

    return () => {
      if (timerRef.current) {
        Taro.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      clearCallingTimer();
    };
  }, [storeQueue?.id, storeQueue?.status, advanceQueue, queueCancelled]);

  useDidShow(() => {
    if (storeQueue) {
      checkAndSpeak(storeQueue);
    }
  });

  useDidHide(() => {
    // 页面隐藏时也保持定时器，因为状态在 store 中持久化
  });

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
      clearCallingTimer();
      const { prefix, num } = parseQueueNumber(storeQueue.queueNumber);
      const newQueueNum = formatQueueNumber(prefix, num + 50);
      const now = new Date();
      const newEstimate = new Date(now.getTime() + (storeQueue.waitTime + 10) * 60000);
      const estStr = `${newEstimate.getHours().toString().padStart(2, '0')}:${newEstimate.getMinutes().toString().padStart(2, '0')}`;
      const takeTime = now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');

      const newId = `${storeQueue.id}-rq-${Date.now()}`;
      const originalForRecord = { ...storeQueue };

      const updated: QueueInfo = {
        ...storeQueue,
        id: newId,
        queueNumber: newQueueNum,
        aheadCount: 5,
        waitTime: storeQueue.waitTime + 10,
        status: 'waiting',
        windowNo: undefined,
        estimatedCallTime: estStr,
        takeTime,
        currentNumber: storeQueue.currentNumber,
      };

      requeueStore(originalForRecord, updated);
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
              <Text className={styles.passHint}>⚠️ 叫号超时未到将视为过号</Text>
            </View>
            <View
              className={classnames(styles.actionBtn, styles.success)}
              style={{ marginTop: '24rpx', width: '100%' }}
              onClick={() => {
                clearCallingTimer();
                updateQueue({ status: 'processing' });
                setTimeout(() => handleCompleted(), 3000);
              }}
            >
              ✅ 我已到窗口，开始办理
            </View>
          </View>
        )}

        {storeQueue.status === 'passed' && (
          <View className={styles.section}>
            <View className={classnames(styles.currentNumber, styles.passedBox)}>
              <Text className={styles.label}>⏰ 过号提醒</Text>
              <Text className={styles.passedText}>您的号码 {storeQueue.queueNumber} 已过号</Text>
              <Text className={styles.window}>请前往咨询台或点击下方申请重排</Text>
              {storeQueue.windowNo && (
                <Text className={styles.hintText}>原叫号窗口：{storeQueue.windowNo}</Text>
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
