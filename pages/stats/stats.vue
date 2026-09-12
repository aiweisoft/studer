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
        <text class="summary-value">{{ summary.totalText }}</text>
        <text class="summary-label">累计时长</text>
      </view>
      <view class="summary-item">
        <text class="summary-value">{{ summary.avgText }}</text>
        <text class="summary-label">日均时长</text>
      </view>
      <view class="summary-item">
        <text class="summary-value">{{ summary.count }}</text>
        <text class="summary-label">记录次数</text>
      </view>
    </view>

    <view class="chart-section">
      <view class="section-title">近 7 天趋势</view>
      <view class="trend">
        <view v-for="d in trend" :key="d.date" class="trend-col">
          <text class="trend-val">{{ d.minutes > 0 ? d.minutes : '' }}</text>
          <view class="trend-bar-wrap">
            <view class="trend-bar" :style="{ height: d.barHeight + 'rpx' }"></view>
          </view>
          <text class="trend-label">{{ d.label }}</text>
        </view>
      </view>
      <text class="trend-unit">单位：分钟</text>
    </view>

    <view class="chart-section">
      <view class="section-title">各科目时长分布</view>
      <view v-if="subjectStats.length === 0" class="empty-chart">
        <text>暂无数据</text>
      </view>
      <view v-for="s in subjectStats" :key="s.id" class="bar-row">
        <view class="bar-label">
          <view class="bar-dot" :style="{ background: s.color }"></view>
          <text class="bar-name">{{ s.name }}</text>
        </view>
        <view class="bar-track">
          <view class="bar-fill" :style="{ width: s.percent + '%', background: s.color }"></view>
        </view>
        <text class="bar-value">{{ s.text }}</text>
      </view>
    </view>

    <view class="daily-section">
      <view class="section-head">
        <text class="section-title">每日明细</text>
        <text class="section-sub">共 {{ dailyRecords.length }} 天</text>
      </view>
      <view v-if="dailyRecords.length === 0" class="empty-chart">
        <text>暂无记录</text>
      </view>
      <view v-for="d in dailyRecords" :key="d.date" class="daily-item">
        <view class="daily-badge">
          <text class="badge-month">{{ d.month }}月</text>
          <text class="badge-day">{{ d.day }}</text>
        </view>
        <view class="daily-main">
          <view class="daily-top">
            <text class="daily-hours">{{ d.text }}</text>
            <text class="daily-meta">{{ d.week }} · {{ d.count }} 次</text>
          </view>
          <view class="daily-track">
            <view class="daily-fill" :style="{ width: d.percent + '%' }"></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getRecords, getSubjects, getRecordsByRange, getWeekRangeStr, getMonthRangeStr, getTodayStr } from '../../utils/storage'

const activeTab = ref('week')
const tabs = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' }
]

const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getRange() {
  if (activeTab.value === 'today') {
    const d = getTodayStr()
    return { start: d, end: d }
  }
  if (activeTab.value === 'week') return getWeekRangeStr()
  if (activeTab.value === 'month') return getMonthRangeStr()
  return { start: '', end: '' }
}

function fmtShort(seconds) {
  const s = Math.round(seconds)
  if (s <= 0) return '0分'
  if (s < 3600) return Math.round(s / 60) + '分'
  const h = Math.round((s / 3600) * 10) / 10
  return h + '小时'
}

const filteredRecords = computed(() => {
  if (activeTab.value === 'today') {
    const d = getTodayStr()
    return getRecords().filter(r => r.date === d)
  }
  const range = getRange()
  if (!range.start) return getRecords()
  return getRecordsByRange(range.start, range.end)
})

const summary = computed(() => {
  const records = filteredRecords.value
  const totalDays = new Set(records.map(r => r.date)).size
  const totalSeconds = records.reduce((s, r) => s + r.duration, 0)
  return {
    totalDays,
    count: records.length,
    totalText: fmtShort(totalSeconds),
    avgText: totalDays > 0 ? fmtShort(totalSeconds / totalDays) : '0分'
  }
})

const subjectStats = computed(() => {
  const records = filteredRecords.value
  const subjects = getSubjects()
  const map = {}
  records.forEach(r => {
    map[r.subjectId] = (map[r.subjectId] || 0) + r.duration
  })
  const totalSeconds = Object.values(map).reduce((s, v) => s + v, 0)
  return Object.entries(map).map(([id, seconds]) => {
    const sub = subjects.find(s => s.id === id)
    return {
      id,
      name: sub ? sub.name : '未分类',
      color: sub ? sub.color : '#999',
      seconds,
      text: fmtShort(seconds),
      percent: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0
    }
  }).sort((a, b) => b.seconds - a.seconds)
})

const trend = computed(() => {
  const map = {}
  getRecords().forEach(r => {
    map[r.date] = (map[r.date] || 0) + r.duration
  })
  const today = parseDate(getTodayStr())
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(fmtDate(d))
  }
  const max = Math.max(1, ...dates.map(d => map[d] || 0))
  return dates.map(d => {
    const seconds = map[d] || 0
    return {
      date: d,
      minutes: Math.round(seconds / 60),
      barHeight: seconds > 0 ? Math.max(8, Math.round((seconds / max) * 180)) : 4,
      label: weekLabels[parseDate(d).getDay()]
    }
  })
})

const dailyRecords = computed(() => {
  const records = filteredRecords.value
  const map = {}
  records.forEach(r => {
    if (!map[r.date]) map[r.date] = { seconds: 0, count: 0 }
    map[r.date].seconds += r.duration
    map[r.date].count++
  })
  const list = Object.entries(map).map(([date, data]) => {
    const dt = parseDate(date)
    return {
      date,
      seconds: data.seconds,
      count: data.count,
      day: String(dt.getDate()).padStart(2, '0'),
      month: dt.getMonth() + 1,
      week: weekLabels[dt.getDay()],
      text: fmtShort(data.seconds)
    }
  }).sort((a, b) => b.date.localeCompare(a.date))
  const max = Math.max(1, ...list.map(d => d.seconds))
  list.forEach(d => {
    d.percent = d.seconds > 0 ? Math.max(6, Math.round((d.seconds / max) * 100)) : 0
  })
  return list
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
  padding: 30rpx 10rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.summary-item {
  flex: 1;
  text-align: center;
}
.summary-value {
  font-size: 34rpx;
  font-weight: 700;
  color: #333;
  display: block;
}
.summary-label {
  font-size: 22rpx;
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
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 20rpx;
}
.section-head .section-title {
  margin-bottom: 0;
}
.section-sub {
  font-size: 22rpx;
  color: #999;
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

.trend {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8rpx;
}
.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.trend-val {
  font-size: 18rpx;
  color: #999;
  height: 26rpx;
  line-height: 26rpx;
}
.trend-bar-wrap {
  width: 100%;
  height: 190rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.trend-bar {
  width: 56%;
  border-radius: 8rpx 8rpx 0 0;
  background: linear-gradient(180deg, #667eea, #764ba2);
}
.trend-label {
  font-size: 20rpx;
  color: #999;
  margin-top: 8rpx;
}
.trend-unit {
  display: block;
  text-align: right;
  font-size: 20rpx;
  color: #bbb;
  margin-top: 10rpx;
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
  width: 130rpx;
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
.bar-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  width: 100rpx;
  text-align: right;
  font-size: 24rpx;
  color: #666;
  flex-shrink: 0;
}

.daily-item {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
}
.daily-item + .daily-item {
  border-top: 1rpx solid #f4f5f9;
}
.daily-badge {
  width: 84rpx;
  height: 84rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #eef1ff, #f3edff);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.badge-month {
  font-size: 18rpx;
  color: #9aa0c0;
  line-height: 1;
}
.badge-day {
  font-size: 34rpx;
  font-weight: 700;
  color: #667eea;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.daily-main {
  flex: 1;
  margin-left: 22rpx;
  min-width: 0;
}
.daily-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12rpx;
}
.daily-hours {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}
.daily-meta {
  font-size: 22rpx;
  color: #999;
}
.daily-track {
  height: 12rpx;
  background: #f0f2f7;
  border-radius: 6rpx;
  overflow: hidden;
}
.daily-fill {
  height: 100%;
  border-radius: 6rpx;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
}
</style>
