import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { recordList } from '@/data/records';
import { RecordItem } from '@/types';
import classnames from 'classnames';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [serviceRating, setServiceRating] = useState<number>(0);
  const [waitRating, setWaitRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tabs = [
    { key: 'all', name: '全部' },
    { key: 'completed', name: '已完成' },
    { key: 'passed', name: '已过号' },
  ];

  const quickTags = ['服务态度好', '办理速度快', '等待时间短', '环境整洁', '指引清晰', '需要改进'];

  useEffect(() => {
    loadRecords();
  }, []);

  useDidShow(() => {
    loadRecords();
  });

  const loadRecords = () => {
    setRecords([...recordList]);
  };

  const getFilteredRecords = () => {
    if (activeTab === 'all') return records;
    return records.filter(r => r.status === activeTab);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      completed: '已完成',
      passed: '已过号',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  const handleRating = (record: RecordItem) => {
    if (record.rating) {
      Taro.showToast({
        title: '您已评价过',
        icon: 'none'
      });
      return;
    }
    setSelectedRecord(record);
    setServiceRating(0);
    setWaitRating(0);
    setComment('');
    setSelectedTags([]);
    setShowRatingModal(true);
  };

  const handleServiceRate = (star: number) => {
    setServiceRating(star);
  };

  const handleWaitRate = (star: number) => {
    setWaitRating(star);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const submitRating = () => {
    if (serviceRating === 0 || waitRating === 0) {
      Taro.showToast({
        title: '请完成星级评价',
        icon: 'none'
      });
      return;
    }

    console.log('[Profile] 提交评价:', {
      record: selectedRecord?.id,
      serviceRating,
      waitRating,
      comment,
      tags: selectedTags
    });

    if (selectedRecord) {
      setRecords(prev => prev.map(r =>
        r.id === selectedRecord.id
          ? { ...r, rating: Math.round((serviceRating + waitRating) / 2), comment }
          : r
      ));
    }

    setShowRatingModal(false);
    Taro.showToast({
      title: '评价成功',
      icon: 'success'
    });
  };

  const renderStars = (rating: number, onRate?: (star: number) => void, interactive: boolean = false) => {
    return (
      <View className={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <Text
            key={star}
            className={styles.star}
            onClick={interactive ? () => onRate?.(star) : undefined}
          >
            {star <= rating ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  const filteredRecords = getFilteredRecords();

  const completedCount = records.filter(r => r.status === 'completed').length;
  const totalSavedTime = completedCount * 15;

  const menuItems = [
    { icon: '🔊', text: '语音播报设置', path: '/pages/reminder/index' },
    { icon: '🔍', text: '大字模式', path: '/pages/reminder/index' },
    { icon: '📍', text: '常用地址', path: '' },
    { icon: '📞', text: '联系客服', path: '' },
    { icon: '⚙️', text: '设置', path: '' },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    console.log('[Profile] 点击菜单:', item.text);
    if (item.path) {
      if (item.path.startsWith('/pages/reminder')) {
        Taro.switchTab({ url: item.path });
      }
    } else {
      Taro.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>👤</View>
          <View className={styles.userDetail}>
            <Text className={styles.userName}>市民您好</Text>
            <Text className={styles.userDesc}>实名用户 · 办事更便捷</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{completedCount}</Text>
            <Text className={styles.statLabel}>已办事项</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{totalSavedTime}</Text>
            <Text className={styles.statLabel}>节省时间(分)</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>5</Text>
            <Text className={styles.statLabel}>办事大厅</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, {
              [styles.active]: activeTab === tab.key
            })}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.name}
          </View>
        ))}
      </View>

      <ScrollView scrollY enhanced showScrollbar={false} style={{ height: 'calc(100vh - 500rpx)' }}>
        <View className={styles.recordList}>
          {filteredRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>暂无相关记录</Text>
            </View>
          ) : (
            filteredRecords.map((record) => (
              <View key={record.id} className={styles.recordItem}>
                <View className={styles.recordHeader}>
                  <Text className={styles.serviceName}>{record.serviceName}</Text>
                  <View className={classnames(styles.statusBadge, styles[record.status])}>
                    {getStatusText(record.status)}
                  </View>
                </View>

                <View className={styles.recordInfo}>
                  <Text>{record.hallName}</Text>
                  <Text>{`\n`}</Text>
                  <Text>号码：{record.queueNumber}</Text>
                  <Text>{`\n`}</Text>
                  <Text>取号时间：{record.takeTime}</Text>
                  {record.completeTime && (
                    <>
                      <Text>{`\n`}</Text>
                      <Text>办结时间：{record.completeTime}</Text>
                    </>
                  )}
                  {record.windowNo && (
                    <>
                      <Text>{`\n`}</Text>
                      <Text>办理窗口：{record.windowNo}</Text>
                    </>
                  )}
                </View>

                {record.rating && (
                  <View className={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Text key={star} className={styles.star}>
                        {star <= record.rating ? '⭐' : '☆'}
                      </Text>
                    ))}
                  </View>
                )}

                {record.status === 'completed' && !record.rating && (
                  <View className={styles.recordActions}>
                    <View
                      className={classnames(styles.actionBtn, styles.primary)}
                      onClick={() => handleRating(record)}
                    >
                      去评价
                    </View>
                    <View className={classnames(styles.actionBtn, styles.secondary)}>
                      查看详情
                    </View>
                  </View>
                )}

                {record.status === 'passed' && (
                  <View className={styles.recordActions}>
                    <View
                      className={classnames(styles.actionBtn, styles.primary)}
                      onClick={() => Taro.switchTab({ url: '/pages/queue/index' })}
                    >
                      再次取号
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View className={styles.menuSection}>
          {menuItems.map((item, index) => (
            <View
              key={index}
              className={styles.menuItem}
              onClick={() => handleMenuClick(item)}
            >
              <View className={styles.menuIcon}>{item.icon}</View>
              <Text className={styles.menuText}>{item.text}</Text>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {showRatingModal && (
        <View className={styles.modalOverlay} onClick={() => setShowRatingModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.ratingModal}>
              <Text className={styles.modalTitle}>服务评价</Text>

              <View className={styles.ratingSection}>
                <Text className={styles.ratingLabel}>窗口服务</Text>
                {renderStars(serviceRating, handleServiceRate, true)}
              </View>

              <View className={styles.ratingSection}>
                <Text className={styles.ratingLabel}>等候体验</Text>
                {renderStars(waitRating, handleWaitRate, true)}
              </View>

              <View className={styles.ratingSection}>
                <Text className={styles.ratingLabel}>快捷评价</Text>
                <View className={styles.tagList}>
                  {quickTags.map((tag, idx) => (
                    <View
                      key={idx}
                      className={classnames(styles.quickTag, {
                        [styles.active]: selectedTags.includes(tag)
                      })}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.ratingSection}>
                <Text className={styles.ratingLabel}>补充意见（选填）</Text>
                <Input
                  className={styles.commentInput}
                  placeholder="请输入您的意见和建议..."
                  placeholderTextColor="#c9cdd4"
                  value={comment}
                  onInput={(e: any) => setComment(e.detail.value)}
                />
              </View>

              <View className={styles.modalFooter}>
                <View className={styles.cancelBtn} onClick={() => setShowRatingModal(false)}>
                  取消
                </View>
                <View className={styles.submitBtn} onClick={submitRating}>
                  提交评价
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProfilePage;
