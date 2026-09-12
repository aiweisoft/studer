<template>
  <view class="page">
    <view class="header">
      <text class="greeting">{{ greeting }}</text>
      <text class="date">{{ todayStr }}</text>
    </view>

    <view class="progress-card">
      <view class="progress-circle">
        <view class="progress-center">
          <text class="progress-hours">{{ todayHours }}</text>
          <text class="progress-label">今日已学(小时)</text>
        </view>
      </view>
    </view>

    <view class="timer-section">
      <view class="section-title">学习计时</view>
      <view class="timer-display">{{ timerDisplay }}</view>
      <view class="timer-controls">
        <picker :range="subjectList" :range-key="'name'" @change="onSubjectChange">
          <view class="picker-btn">{{ selectedSubject ? selectedSubject.name : '选择科目' }}</view>
        </picker>
        <input class="content-input" v-model="studyContent" placeholder="输入学习内容" />
      </view>
      <view class="timer-actions">
        <button v-if="!timerRunning" class="btn-start" @click="startTimer">开始学习</button>
        <button v-else class="btn-stop" @click="stopTimer">结束学习</button>
      </view>
    </view>

    <view class="records-section">
      <view class="section-title">今日记录</view>
      <view v-if="todayRecords.length === 0" class="empty">
        <text>今天还没有学习记录，开始学习吧！</text>
      </view>
      <view v-for="r in todayRecords" :key="r.id" class="record-item">
        <view class="record-subject" :style="{ background: getSubjectColor(r.subjectId) }"></view>
        <view class="record-info">
          <text class="record-content">{{ r.content || getSubjectName(r.subjectId) }}</text>
          <text class="record-time">{{ formatRecordTime(r) }}</text>
        </view>
        <text class="record-duration">{{ formatDuration(r.duration) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { getRecordsByDate, getSubjects, getRecords, saveRecord, formatDuration, getTodayStr } from '../../utils/storage'

const todayStr = getTodayStr()
const todayRecords = ref([])
const subjectList = ref([])
const selectedSubjectId = ref('')
const studyContent = ref('')
const timerRunning = ref(false)
const timerStartTime = ref(null)
const elapsedSeconds = ref(0)
let timerInterval = null

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const now = new Date()
const greeting = computed(() => {
  const h = now.getHours()
  let g = '你好'
  if (h < 6) g = '夜深了'
  else if (h < 9) g = '早上好'
  else if (h < 12) g = '上午好'
  else if (h < 14) g = '中午好'
  else if (h < 18) g = '下午好'
  else g = '晚上好'
  return g
})

const selectedSubject = computed(() => {
  return subjectList.value.find(s => s.id === selectedSubjectId.value)
})

const todayHours = computed(() => {
  const total = todayRecords.value.reduce((sum, r) => sum + r.duration, 0)
  const h = (total / 3600).toFixed(1)
  return h
})

const timerDisplay = computed(() => {
  return formatDuration(elapsedSeconds.value)
})

function getSubjectColor(id) {
  const s = subjectList.value.find(s => s.id === id)
  return s ? s.color : '#999'
}

function getSubjectName(id) {
  const s = subjectList.value.find(s => s.id === id)
  return s ? s.name : '未分类'
}

function formatRecordTime(r) {
  if (!r.startTime) return ''
  const d = new Date(r.startTime)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function onSubjectChange(e) {
  selectedSubjectId.value = subjectList.value[e.detail.value]?.id || ''
}

function startTimer() {
  if (!selectedSubjectId.value) {
    uni.showToast({ title: '请选择科目', icon: 'none' })
    return
  }
  timerRunning.value = true
  timerStartTime.value = Date.now()
  timerInterval = setInterval(() => {
    elapsedSeconds.value = Math.floor((Date.now() - timerStartTime.value) / 1000)
  }, 1000)
}

function stopTimer() {
  timerRunning.value = false
  clearInterval(timerInterval)
  const record = {
    planId: '',
    subjectId: selectedSubjectId.value,
    content: studyContent.value,
    startTime: new Date(timerStartTime.value).toISOString(),
    endTime: new Date().toISOString(),
    duration: elapsedSeconds.value,
    date: todayStr
  }
  saveRecord(record)
  studyContent.value = ''
  elapsedSeconds.value = 0
  loadRecords()
  uni.showToast({ title: '学习记录已保存', icon: 'success' })
}

function loadRecords() {
  todayRecords.value = getRecordsByDate(todayStr).sort((a, b) => {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  })
  subjectList.value = getSubjects()
}

onShow(() => {
  loadRecords()
})

onUnload(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style>
.page {
  padding: 30rpx;
  min-height: 100vh;
  background: #f5f7fa;
}
.header {
  margin-bottom: 30rpx;
}
.greeting {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}
.date {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.progress-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20rpx;
  padding: 50rpx 40rpx;
  margin-bottom: 30rpx;
  display: flex;
  justify-content: center;
}
.progress-circle {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-center {
  text-align: center;
}
.progress-hours {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  display: block;
}
.progress-label {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.timer-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.timer-display {
  font-size: 72rpx;
  font-weight: 700;
  color: #333;
  text-align: center;
  font-variant-numeric: tabular-nums;
  margin: 20rpx 0;
}
.timer-controls {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.picker-btn {
  padding: 16rpx 30rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #666;
  white-space: nowrap;
}
.content-input {
  flex: 1;
  padding: 16rpx 24rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.timer-actions {
  display: flex;
  justify-content: center;
}
.btn-start {
  width: 80%;
  background: #667eea;
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  padding: 20rpx 0;
}
.btn-stop {
  width: 80%;
  background: #e74c3c;
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  padding: 20rpx 0;
}

.records-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.empty {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 28rpx;
}
.record-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.record-item:last-child {
  border-bottom: none;
}
.record-subject {
  width: 12rpx;
  height: 60rpx;
  border-radius: 6rpx;
  margin-right: 20rpx;
}
.record-info {
  flex: 1;
}
.record-content {
  font-size: 28rpx;
  color: #333;
  display: block;
}
.record-time {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}
.record-duration {
  font-size: 28rpx;
  color: #667eea;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
