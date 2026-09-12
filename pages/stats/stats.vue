<template>
  <view class="page">
    <view class="header">
      <text class="page-title">学习统计</text>
    </view>

    <view class="tabs">
      <view v-for="tab in tabs" :key="tab.key" class="tab" :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)">
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <view class="summary-card">
      <view class="summary-item">
        <text class="summary-value">{{ summary.totalDays }}</text>
        <text class="summary-label">学习天数</text>
      </view>
      <view class="summary-item">
        <text class="summary-value">{{ summary.totalHours }}</text>
        <text class="summary-label">总时长(h)</text>
      </view>
      <view class="summary-item">
        <text class="summary-value">{{ summary.avgDaily }}</text>
        <text class="summary-label">日均(h)</text>
      </view>
    </view>

    <view class="chart-section">
      <view class="section-title">各科目时长分布</view>
      <view v-if="subjectStats.length === 0" class="empty-chart">
        <text>暂无数据</text>
      </view>
      <view v-for="s in subjectStats" :key="s.id" class="bar-row">
        <view class="bar-label">
          <view class="bar-dot" :style="{ background: s.color }"></view>
          <text>{{ s.name }}</text>
        </view>
        <view class="bar-track">
          <view class="bar-fill" :style="{ width: s.percent + '%', background: s.color }"></view>
        </view>
        <text class="bar-value">{{ s.hours }}h</text>
      </view>
    </view>

    <view class="daily-section">
      <view class="section-title">每日记录</view>
      <view v-if="dailyRecords.length === 0" class="empty-chart">
        <text>暂无记录</text>
      </view>
      <view v-for="d in dailyRecords" :key="d.date" class="daily-item">
        <text class="daily-date">{{ d.date }}</text>
        <text class="daily-hours">{{ d.hours }}h</text>
        <text class="daily-count">{{ d.count }} 条记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getRecords, getSubjects, getRecordsByRange, getWeekRangeStr, getMonthRangeStr, formatDuration } from '../../utils/storage'

const activeTab = ref('week')
const tabs = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' }
]

function getRange() {
  if (activeTab.value === 'week') {
    const r = getWeekRangeStr()
    return { start: r.start, end: r.end }
  }
  if (activeTab.value === 'month') {
    const r = getMonthRangeStr()
    return { start: r.start, end: r.end }
  }
  return { start: '', end: '' }
}

const filteredRecords = computed(() => {
  const range = getRange()
  if (!range.start) return getRecords()
  return getRecordsByRange(range.start, range.end)
})

const summary = computed(() => {
  const records = filteredRecords.value
  const dateSet = new Set(records.map(r => r.date))
  const totalDays = dateSet.size
  const totalSeconds = records.reduce((s, r) => s + r.duration, 0)
  const totalHours = (totalSeconds / 3600).toFixed(1)
  const avgDaily = totalDays > 0 ? (totalSeconds / totalDays / 3600).toFixed(1) : '0'
  return { totalDays, totalHours, avgDaily }
})

const subjectStats = computed(() => {
  const records = filteredRecords.value
  const subjects = getSubjects()
  const map = {}
  records.forEach(r => {
    if (!map[r.subjectId]) map[r.subjectId] = 0
    map[r.subjectId] += r.duration
  })
  const totalSeconds = Object.values(map).reduce((s, v) => s + v, 0)
  return Object.entries(map).map(([id, seconds]) => {
    const sub = subjects.find(s => s.id === id)
    return {
      id,
      name: sub ? sub.name : '未分类',
      color: sub ? sub.color : '#999',
      seconds,
      hours: (seconds / 3600).toFixed(1),
      percent: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0
    }
  }).sort((a, b) => b.seconds - a.seconds)
})

const dailyRecords = computed(() => {
  const records = filteredRecords.value
  const map = {}
  records.forEach(r => {
    if (!map[r.date]) map[r.date] = { seconds: 0, count: 0 }
    map[r.date].seconds += r.duration
    map[r.date].count++
  })
  return Object.entries(map)
    .map(([date, data]) => ({
      date,
      hours: (data.seconds / 3600).toFixed(1),
      count: data.count
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
})

function switchTab(key) {
  activeTab.value = key
}

onShow(() => {})
</script>

<style>
.page {
  padding: 30rpx;
  min-height: 100vh;
  background: #f5f7fa;
}
.header {
  margin-bottom: 24rpx;
}
.page-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

.tabs {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 8rpx;
  margin-bottom: 30rpx;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;
  border-radius: 8rpx;
}
.tab.active {
  background: #667eea;
  color: #fff;
  font-weight: 600;
}

.summary-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.summary-item {
  flex: 1;
  text-align: center;
}
.summary-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
  display: block;
}
.summary-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.chart-section, .daily-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}
.empty-chart {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 28rpx;
}

.bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  gap: 16rpx;
}
.bar-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  width: 120rpx;
  font-size: 26rpx;
  color: #333;
  flex-shrink: 0;
}
.bar-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 20rpx;
  background: #f0f0f0;
  border-radius: 10rpx;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 10rpx;
  transition: width 0.3s;
}
.bar-value {
  width: 80rpx;
  text-align: right;
  font-size: 24rpx;
  color: #666;
  flex-shrink: 0;
}

.daily-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.daily-item:last-child {
  border-bottom: none;
}
.daily-date {
  width: 140rpx;
  font-size: 26rpx;
  color: #333;
}
.daily-hours {
  flex: 1;
  font-size: 28rpx;
  color: #667eea;
  font-weight: 600;
}
.daily-count {
  font-size: 24rpx;
  color: #999;
}
</style>
