import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { reminderList, getUnreadReminderCount } from '@/data/records';
import { ReminderItem } from '@/types';
import classnames from 'classnames';

const ReminderPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);
  const [bigFontMode, setBigFontMode] = useState<boolean>(false);
  const [systemNotice, setSystemNotice] = useState<boolean>(true);

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
    console.log('[Reminder] 点击提醒:', reminder.title);
    if (!reminder.read) {
      markAsRead(reminder.id);
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
    console.log('[Reminder] 全部标记为已读');
    setReminders(prev => prev.map(r => ({ ...r, read: true })));
    setUnreadCount(0);
    Taro.showToast({
      title: '已全部标为已读',
      icon: 'success'
    });
  };

  const handleVoiceToggle = () => {
    setVoiceEnabled(!voiceEnabled);
    console.log('[Reminder] 语音播报:', !voiceEnabled);
    if (!voiceEnabled) {
      Taro.showToast({
        title: '语音播报已开启',
        icon: 'success'
      });
    }
  };

  const handleVibrateToggle = () => {
    setVibrateEnabled(!vibrateEnabled);
    console.log('[Reminder] 震动提醒:', !vibrateEnabled);
  };

  const handleBigFontToggle = () => {
    setBigFontMode(!bigFontMode);
    console.log('[Reminder] 大字模式:', !bigFontMode);
    Taro.showToast({
      title: bigFontMode ? '已关闭大字模式' : '已开启大字模式',
      icon: 'none'
    });
  };

  const handleSystemNoticeToggle = () => {
    setSystemNotice(!systemNotice);
    console.log('[Reminder] 系统通知:', !systemNotice);
  };

  const testVoice = () => {
    console.log('[Reminder] 测试语音播报');
    Taro.showToast({
      title: '正在播放测试语音...',
      icon: 'none'
    });
  };

  const filteredReminders = getFilteredReminders();

  const getUnreadCountByType = (type: string) => {
    if (type === 'all') return unreadCount;
    return reminders.filter(r => 
      !r.read && (r.type === type || (type === 'call' && r.type === 'queue'))
    ).length;
  };

  return (
    <View className={styles.container}>
      <View className={styles.bigFontTip}>
        <Text className={styles.tipIcon}>👴</Text>
        <Text className={styles.tipText}>
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
              {tab.name}
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
                    <Text className={styles.reminderTitle}>{reminder.title}</Text>
                    <Text className={styles.reminderTime}>{reminder.time}</Text>
                  </View>
                </View>
                <Text className={styles.reminderContent}>{reminder.content}</Text>
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
            <Text>提醒设置</Text>
          </View>

          <View className={styles.settingItem}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>语音播报</Text>
              <Text className={styles.settingDesc}>叫号时语音提醒，避免错过</Text>
              {voiceEnabled && (
                <View className={styles.voiceTest} onClick={testVoice}>
                  <Text className={styles.voiceIcon}>🔊</Text>
                  <Text className={styles.voiceText}>点击试听播报效果</Text>
                  <Text className={styles.playBtn}>播放</Text>
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
              <Text className={styles.settingName}>震动提醒</Text>
              <Text className={styles.settingDesc}>叫号时手机震动提醒</Text>
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
              <Text className={styles.settingName}>大字模式</Text>
              <Text className={styles.settingDesc}>增大字号，方便老年人阅读</Text>
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
              <Text className={styles.settingName}>系统通知</Text>
              <Text className={styles.settingDesc}>接收系统公告和大厅通知</Text>
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
            <Text>提醒时间</Text>
          </View>

          <View className={styles.settingItem}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>提前提醒</Text>
              <Text className={styles.settingDesc}>当前方还有5人时提醒</Text>
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
