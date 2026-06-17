import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { reminderList, getUnreadReminderCount } from '@/data/records';
import { ReminderItem } from '@/types';
import { useAppStore } from '@/store';
import { speak } from '@/utils/speech';
import classnames from 'classnames';

const ReminderPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const voiceEnabled = useAppStore(state => state.settings.voiceEnabled);
  const vibrateEnabled = useAppStore(state => state.settings.vibrateEnabled);
  const bigFontMode = useAppStore(state => state.settings.bigFontMode);
  const systemNotice = useAppStore(state => state.settings.systemNotice);
  const setVoiceEnabled = useAppStore(state => state.setVoiceEnabled);
  const setVibrateEnabled = useAppStore(state => state.setVibrateEnabled);
  const setBigFontMode = useAppStore(state => state.setBigFontMode);
  const setSystemNotice = useAppStore(state => state.setSystemNotice);

  const tabs = [
    { key: 'all', name: '全部' },
    { key: 'call', name: '叫号' },
    { key: 'material', name: '材料' },
    { key: 'system', name: '系统' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useDidShow(() => {
    loadData();
  });

  const loadData = () => {
    setReminders([...reminderList]);
    setUnreadCount(getUnreadReminderCount());
  };

  const getFilteredReminders = () => {
    if (activeTab === 'all') return reminders;
    return reminders.filter(r => r.type === activeTab || (activeTab === 'call' && r.type === 'queue'));
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      call: '🔔',
      material: '📋',
      queue: '📱',
      system: '📢'
    };
    return iconMap[type] || '📌';
  };

  const handleReminderClick = (reminder: ReminderItem) => {
    if (!reminder.read) {
      markAsRead(reminder.id);
    }
    if (voiceEnabled) {
      speak(reminder.content);
    }
    if (reminder.relatedQueueId) {
      Taro.switchTab({ url: '/pages/progress/index' });
    }
  };

  const markAsRead = (id: string) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, read: true } : r
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    setReminders(prev => prev.map(r => ({ ...r, read: true })));
    setUnreadCount(0);
    Taro.showToast({
      title: '已全部标为已读',
      icon: 'success'
    });
  };

  const handleVoiceToggle = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    Taro.showToast({
      title: newVal ? '语音播报已开启' : '语音播报已关闭',
      icon: 'none'
    });
  };

  const handleVibrateToggle = () => {
    setVibrateEnabled(!vibrateEnabled);
  };

  const handleBigFontToggle = () => {
    const newVal = !bigFontMode;
    setBigFontMode(newVal);
    Taro.showToast({
      title: newVal ? '已开启大字模式' : '已关闭大字模式',
      icon: 'none'
    });
  };

  const handleSystemNoticeToggle = () => {
    setSystemNotice(!systemNotice);
  };

  const testVoice = () => {
    if (!voiceEnabled) {
      Taro.showToast({
        title: '请先开启语音播报',
        icon: 'none',
      });
      return;
    }
    speak(
      '请A0243号，前往A03窗口办理不动产登记业务，地点在市政务服务中心。请A0243号，前往A03窗口办理。',
      { type: 'calling' }
    );
  };

  const testNearby = () => {
    if (!voiceEnabled) {
      Taro.showToast({
        title: '请先开启语音播报',
        icon: 'none',
      });
      return;
    }
    speak(
      '温馨提示，您的号码A0250前方还有2人，预计等待3分钟。办理地点是区政务服务分中心，业务是社保卡办理，请注意叫号。',
      { type: 'warning' }
    );
  };

  const filteredReminders = getFilteredReminders();

  const getUnreadCountByType = (type: string) => {
    if (type === 'all') return unreadCount;
    return reminders.filter(r =>
      !r.read && (r.type === type || (type === 'call' && r.type === 'queue'))
    ).length;
  };

  const fontSizeStyle = bigFontMode ? { fontSize: '36rpx' } : {};
  const titleFontSizeStyle = bigFontMode ? { fontSize: '40rpx' } : {};
  const descFontSizeStyle = bigFontMode ? { fontSize: '32rpx' } : {};

  return (
    <View className={classnames(styles.container, { [styles.bigFont]: bigFontMode })}>
      <View className={styles.bigFontTip}>
        <Text className={styles.tipIcon}>👴</Text>
        <Text className={styles.tipText} style={bigFontMode ? { fontSize: '28rpx' } : {}}>
          老年人可开启大字模式和语音播报，使用更方便
        </Text>
      </View>

      <View className={styles.tabs}>
        {tabs.map((tab) => {
          const count = getUnreadCountByType(tab.key);
          return (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, {
                [styles.active]: activeTab === tab.key
              })}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text style={bigFontMode ? { fontSize: '30rpx' } : {}}>{tab.name}</Text>
              {count > 0 && (
                <View className={styles.badge}>{count > 99 ? '99+' : count}</View>
              )}
            </View>
          );
        })}
      </View>

      <ScrollView scrollY enhanced showScrollbar={false}>
        {unreadCount > 0 && (
          <View className={styles.markAllRead} onClick={markAllRead}>
            全部标为已读
          </View>
        )}

        <View className={styles.reminderList}>
          {filteredReminders.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyTitle}>暂无提醒</Text>
              <Text className={styles.emptyDesc}>有新消息会在这里显示</Text>
            </View>
          ) : (
            filteredReminders.map((reminder) => (
              <View
                key={reminder.id}
                className={classnames(styles.reminderItem, {
                  [styles.unread]: !reminder.read
                })}
                onClick={() => handleReminderClick(reminder)}
              >
                <View className={styles.reminderHeader}>
                  <View className={classnames(styles.typeIcon, styles[reminder.type])}>
                    {getTypeIcon(reminder.type)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className={styles.reminderTitle} style={titleFontSizeStyle}>{reminder.title}</Text>
                    <Text className={styles.reminderTime} style={bigFontMode ? { fontSize: '24rpx' } : {}}>{reminder.time}</Text>
                  </View>
                </View>
                <Text className={styles.reminderContent} style={fontSizeStyle}>{reminder.content}</Text>
                {reminder.relatedQueueId && (
                  <View className={styles.reminderActions}>
                    <View className={classnames(styles.actionBtn, styles.primary)}>
                      查看进度
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View className={styles.settingsSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>⚙️</Text>
            <Text style={bigFontMode ? { fontSize: '34rpx' } : {}}>提醒设置</Text>
          </View>

          <View className={styles.settingItem}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName} style={fontSizeStyle}>语音播报</Text>
              <Text className={styles.settingDesc} style={descFontSizeStyle}>叫号时语音提醒，避免错过</Text>
              {voiceEnabled && (
                <View className={styles.voiceTestBox}>
                  <View className={styles.voiceTest} onClick={(e) => { e.stopPropagation(); testVoice(); }}>
                    <Text className={styles.voiceIcon}>�</Text>
                    <Text className={styles.voiceText} style={bigFontMode ? { fontSize: '26rpx' } : {}}>正在叫号试听</Text>
                    <Text className={styles.playBtn} style={bigFontMode ? { fontSize: '26rpx' } : {}}>播放</Text>
                  </View>
                  <View className={styles.voiceTest} onClick={(e) => { e.stopPropagation(); testNearby(); }}>
                    <Text className={styles.voiceIcon}>⏰</Text>
                    <Text className={styles.voiceText} style={bigFontMode ? { fontSize: '26rpx' } : {}}>临近叫号试听</Text>
                    <Text className={styles.playBtn} style={bigFontMode ? { fontSize: '26rpx' } : {}}>播放</Text>
                  </View>
                </View>
              )}
            </View>
            <View
              className={classnames(styles.switch, {
                [styles.active]: voiceEnabled
              })}
              onClick={handleVoiceToggle}
            >
              <View className={styles.switchDot} />
            </View>
          </View>

          <View className={styles.settingItem}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName} style={fontSizeStyle}>震动提醒</Text>
              <Text className={styles.settingDesc} style={descFontSizeStyle}>叫号时手机震动提醒</Text>
            </View>
            <View
              className={classnames(styles.switch, {
                [styles.active]: vibrateEnabled
              })}
              onClick={handleVibrateToggle}
            >
              <View className={styles.switchDot} />
            </View>
          </View>

          <View className={styles.settingItem}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName} style={fontSizeStyle}>大字模式</Text>
              <Text className={styles.settingDesc} style={descFontSizeStyle}>增大字号，方便老年人阅读</Text>
            </View>
            <View
              className={classnames(styles.switch, {
                [styles.active]: bigFontMode
              })}
              onClick={handleBigFontToggle}
            >
              <View className={styles.switchDot} />
            </View>
          </View>

          <View className={styles.settingItem}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName} style={fontSizeStyle}>系统通知</Text>
              <Text className={styles.settingDesc} style={descFontSizeStyle}>接收系统公告和大厅通知</Text>
            </View>
            <View
              className={classnames(styles.switch, {
                [styles.active]: systemNotice
              })}
              onClick={handleSystemNoticeToggle}
            >
              <View className={styles.switchDot} />
            </View>
          </View>
        </View>

        <View className={styles.settingsSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>⏰</Text>
            <Text style={bigFontMode ? { fontSize: '34rpx' } : {}}>提醒时间</Text>
          </View>

          <View className={styles.settingItem}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName} style={fontSizeStyle}>提前提醒</Text>
              <Text className={styles.settingDesc} style={descFontSizeStyle}>当前方还有5人时提醒</Text>
            </View>
            <Text style={{ fontSize: '26rpx', color: '#165dff' }}>5人</Text>
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
};

export default ReminderPage;
