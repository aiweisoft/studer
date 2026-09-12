<template>
  <view class="page">
    <view class="header">
      <text class="greeting">{{ greeting }}</text>
      <text class="date">{{ todayStr }}</text>
    </view>

    <view class="progress-card">
      <view class="progress-circle">
        <view class="progress-center">
          <text class="progress-hours">{{ todayStat.value }}</text>
          <text class="progress-label">今日已学({{ todayStat.unit }})</text>
        </view>
      </view>
    </view>

    <view class="goal-card">
      <template v-if="activePlans.length">
        <view class="goal-top">
          <text class="goal-title">今日学习目标</text>
          <text class="goal-detail">已完成 {{ formatSmart(todaySeconds) }} / {{ formatSmart(goalSeconds) }}</text>
        </view>
        <view class="goal-bar">
          <view class="goal-fill" :style="{ width: goalPercent + '%' }"></view>
        </view>
        <view class="goal-foot">
          <text v-if="goalRemainingSeconds > 0" class="goal-left">还需学习 {{ formatSmart(goalRemainingSeconds) }}</text>
          <text v-else class="goal-done">今日目标已达成</text>
          <text class="goal-plans">{{ activePlans.length }} 个进行中计划</text>
        </view>
      </template>
      <view v-else class="goal-empty">
        <text>暂无进行中的学习计划，可在「计划」页创建或导入推荐计划</text>
      </view>
    </view>

    <view class="timer-section">
      <view class="section-title">专注倒计时</view>
      <view class="duration-chips">
        <view v-for="m in durationOptions" :key="m" class="chip"
          :class="{ active: targetMinutes === m, disabled: timerRunning }" @click="selectDuration(m)">
          {{ m }} 分钟
        </view>
        <view class="chip" :class="{ active: isCustom, disabled: timerRunning }" @click="openCustom">
          {{ isCustom ? targetMinutes + ' 分钟' : '自定义' }}
        </view>
      </view>
      <view class="timer-display" :class="{ running: timerRunning }">{{ timerDisplay }}</view>
      <text class="timer-hint">{{ timerHint }}</text>
      <view class="timer-controls">
        <picker :range="subjectList" :range-key="'name'" @change="onSubjectChange" :disabled="timerRunning">
          <view class="picker-btn">{{ selectedSubject ? selectedSubject.name : '选择科目' }}</view>
        </picker>
        <view class="content-input-wrap">
          <input class="content-input" v-model="studyContent" placeholder="输入学习内容（必填）" :disabled="timerRunning" />
        </view>
      </view>
      <view class="timer-actions">
        <button v-if="!timerRunning" class="btn-start" @click="startTimer">开始专注</button>
        <button v-else class="btn-stop" @click="stopTimer">结束</button>
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
          <view class="record-head">
            <text class="record-subject-name">{{ getSubjectName(r.subjectId) }}</text>
            <text class="record-time">{{ formatRecordTime(r) }}</text>
          </view>
          <text class="record-content">{{ r.content || '未填写学习内容' }}</text>
        </view>
        <text class="record-duration">{{ formatDuration(r.duration) }}</text>
      </view>
    </view>

    <view v-if="showCustom" class="modal-mask" @click="showCustom = false">
      <view class="modal" @click.stop>
        <text class="modal-title">自定义时长</text>
        <view class="custom-stepper">
          <view class="step-btn" :class="{ disabled: customDraft <= 1 }" @click="stepCustom(-1)">-</view>
          <view class="custom-value">
            <text class="custom-num">{{ customDraft }}</text>
            <text class="custom-unit">分钟</text>
          </view>
          <view class="step-btn" :class="{ disabled: customDraft >= 60 }" @click="stepCustom(1)">+</view>
        </view>
        <slider :min="1" :max="60" :value="customDraft" activeColor="#667eea" backgroundColor="#e5e7f0"
          block-size="28" @changing="onCustomChanging" @change="onCustomChanging" />
        <view class="custom-range">
          <text>1 分钟</text>
          <text>60 分钟</text>
        </view>
        <view class="modal-actions">
          <button class="btn-cancel" @click="showCustom = false">取消</button>
          <button class="btn-confirm" @click="confirmCustom">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { getRecordsByDate, getSubjects, getPlans, saveRecord, formatDuration, formatSmart, getTodayStr } from '../../utils/storage'

const todayStr = ref(getTodayStr())
const todayRecords = ref([])
const subjectList = ref([])
const plans = ref([])
const selectedSubjectId = ref('')
const studyContent = ref('')
const timerRunning = ref(false)
const durationOptions = [15, 25, 45, 60]
const targetMinutes = ref(25)
const remainingSeconds = ref(25 * 60)
const timerEndTime = ref(null)
const showCustom = ref(false)
const customDraft = ref(30)
let timerStartTimestamp = null
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

const todaySeconds = computed(() => {
  return todayRecords.value.reduce((sum, r) => sum + r.duration, 0)
})

const todayStat = computed(() => {
  const total = todaySeconds.value
  if (total === 0) return { value: 0, unit: '分钟' }
  if (total >= 3600) return { value: (total / 3600).toFixed(1), unit: '小时' }
  if (total >= 60) return { value: Math.round(total / 60), unit: '分钟' }
  return { value: total, unit: '秒' }
})

const activePlans = computed(() => {
  const today = todayStr.value
  return plans.value.filter(p => {
    const startOk = !p.startDate || p.startDate <= today
    const endOk = !p.endDate || p.endDate >= today
    return startOk && endOk
  })
})

const goalSeconds = computed(() => {
  return activePlans.value.reduce((sum, p) => sum + (Number(p.targetHours) || 0) * 3600, 0)
})

const goalRemainingSeconds = computed(() => Math.max(0, goalSeconds.value - todaySeconds.value))

const goalPercent = computed(() => {
  if (goalSeconds.value <= 0) return 0
  return Math.min(100, Math.round((todaySeconds.value / goalSeconds.value) * 100))
})

const timerDisplay = computed(() => {
  return formatDuration(remainingSeconds.value)
})

const timerHint = computed(() => {
  if (timerRunning.value) {
    const done = targetMinutes.value * 60 - remainingSeconds.value
    return `专注中 · 已完成 ${Math.max(0, Math.floor(done / 60))} 分钟`
  }
  return `已选 ${targetMinutes.value} 分钟`
})

const isCustom = computed(() => !durationOptions.includes(targetMinutes.value))

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

function selectDuration(m) {
  if (timerRunning.value) return
  targetMinutes.value = m
  remainingSeconds.value = m * 60
}

function openCustom() {
  if (timerRunning.value) return
  customDraft.value = targetMinutes.value >= 1 && targetMinutes.value <= 60 ? targetMinutes.value : 30
  showCustom.value = true
}

function onCustomChanging(e) {
  customDraft.value = Math.min(60, Math.max(1, parseInt(e.detail.value, 10) || 1))
}

function stepCustom(delta) {
  customDraft.value = Math.min(60, Math.max(1, Number(customDraft.value) + delta))
}

function confirmCustom() {
  const v = Math.min(60, Math.max(1, Number(customDraft.value) || 25))
  targetMinutes.value = v
  remainingSeconds.value = v * 60
  showCustom.value = false
}

function startTimer() {
  if (!selectedSubjectId.value) {
    uni.showToast({ title: '请选择科目', icon: 'none' })
    return
  }
  if (!studyContent.value.trim()) {
    uni.showToast({ title: '请输入学习内容', icon: 'none' })
    return
  }
  timerRunning.value = true
  timerStartTimestamp = Date.now()
  timerEndTime.value = timerStartTimestamp + targetMinutes.value * 60 * 1000
  remainingSeconds.value = targetMinutes.value * 60
  timerInterval = setInterval(tick, 1000)
}

function tick() {
  const left = Math.max(0, Math.round((timerEndTime.value - Date.now()) / 1000))
  remainingSeconds.value = left
  if (left <= 0) completeTimer()
}

function completeTimer() {
  clearInterval(timerInterval)
  timerRunning.value = false
  saveCurrentRecord(targetMinutes.value * 60)
  remainingSeconds.value = targetMinutes.value * 60
  notifyDone()
}

function stopTimer() {
  clearInterval(timerInterval)
  timerRunning.value = false
  const used = targetMinutes.value * 60 - remainingSeconds.value
  if (used > 0) {
    saveCurrentRecord(used)
    uni.showToast({ title: '学习记录已保存', icon: 'success' })
  } else {
    uni.showToast({ title: '时长过短，未记录', icon: 'none' })
  }
  remainingSeconds.value = targetMinutes.value * 60
}

function saveCurrentRecord(duration) {
  if (duration <= 0) return
  saveRecord({
    planId: '',
    subjectId: selectedSubjectId.value,
    content: studyContent.value.trim(),
    startTime: new Date(timerStartTimestamp).toISOString(),
    endTime: new Date().toISOString(),
    duration,
    date: todayStr.value
  })
  studyContent.value = ''
  loadRecords()
}

function notifyDone() {
  if (uni.vibrateLong) uni.vibrateLong()
  uni.showModal({
    title: '专注完成',
    content: `已完成 ${targetMinutes.value} 分钟专注学习，休息一下吧！`,
    showCancel: false,
    confirmText: '好的',
    confirmColor: '#667eea'
  })
}

function loadRecords() {
  todayRecords.value = getRecordsByDate(todayStr.value).sort((a, b) => {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  })
  subjectList.value = getSubjects()
  plans.value = getPlans()
}

onShow(() => {
  todayStr.value = getTodayStr()
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

.goal-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.goal-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16rpx;
}
.goal-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}
.goal-detail {
  font-size: 24rpx;
  color: #999;
}
.goal-bar {
  height: 16rpx;
  background: #f0f2f7;
  border-radius: 8rpx;
  overflow: hidden;
}
.goal-fill {
  height: 100%;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
}
.goal-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}
.goal-left {
  font-size: 26rpx;
  color: #e67e22;
  font-weight: 600;
}
.goal-done {
  font-size: 26rpx;
  color: #2ecc71;
  font-weight: 600;
}
.goal-plans {
  font-size: 24rpx;
  color: #999;
}
.goal-empty {
  text-align: center;
  color: #999;
  font-size: 26rpx;
  padding: 10rpx 0;
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
.duration-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 10rpx;
}
.chip {
  min-width: 128rpx;
  text-align: center;
  padding: 16rpx 20rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #666;
}
.chip.active {
  background: #eef1ff;
  color: #667eea;
  font-weight: 600;
}
.chip.disabled {
  opacity: 0.45;
}
.timer-display {
  font-size: 80rpx;
  font-weight: 700;
  color: #333;
  text-align: center;
  font-variant-numeric: tabular-nums;
  margin: 20rpx 0 6rpx;
}
.timer-display.running {
  color: #667eea;
}
.timer-hint {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
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
.content-input-wrap {
  flex: 1;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
}
.content-input {
  width: 100%;
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
.record-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.record-subject-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #667eea;
}
.record-time {
  font-size: 22rpx;
  color: #999;
}
.record-content {
  font-size: 28rpx;
  color: #333;
  margin-top: 4rpx;
  display: block;
}
.record-duration {
  font-size: 28rpx;
  color: #667eea;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  width: 600rpx;
}
.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
  text-align: center;
}
.custom-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
  margin-bottom: 10rpx;
}
.step-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #eef1ff;
  color: #667eea;
  font-size: 44rpx;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-btn.disabled {
  opacity: 0.35;
}
.custom-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  min-width: 180rpx;
}
.custom-num {
  font-size: 72rpx;
  font-weight: 700;
  color: #667eea;
  font-variant-numeric: tabular-nums;
}
.custom-unit {
  font-size: 28rpx;
  color: #999;
  margin-left: 8rpx;
}
.custom-range {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: #999;
  margin-bottom: 10rpx;
}
.modal-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}
.btn-cancel, .btn-confirm {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  text-align: center;
}
.btn-cancel {
  background: #f0f0f0;
  color: #666;
}
.btn-confirm {
  background: #667eea;
  color: #fff;
}

/* ===== 统一视觉规范 ===== */
.progress-card {
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.25);
}
.goal-card,
.timer-section,
.records-section {
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(31, 41, 55, 0.06);
}
.modal {
  border-radius: 24rpx;
}
.section-title {
  display: flex;
  align-items: center;
  font-size: 30rpx;
  font-weight: 600;
  color: #2b2f3a;
}
.section-title::before {
  content: '';
  width: 8rpx;
  height: 28rpx;
  margin-right: 14rpx;
  border-radius: 4rpx;
  background: linear-gradient(180deg, #667eea, #764ba2);
}
.btn-start,
.btn-stop {
  height: 88rpx;
  line-height: 88rpx;
  padding: 0;
}
.chip,
.picker-btn,
.content-input-wrap {
  border-radius: 14rpx;
}
</style>
