<template>
  <view class="page">
    <view class="header">
      <text class="page-title">学习计划</text>
      <text class="preset-entry" @click="showPreset = true">推荐计划</text>
    </view>

    <view v-if="plans.length === 0" class="empty">
      <image class="empty-img" src="/static/studyplan_logo_path_512.png" mode="aspectFit"></image>
      <text class="empty-text">还没有学习计划，创建一个吧！</text>
    </view>

    <view v-for="plan in planViews" :key="plan.id" class="plan-card" @click="editPlan(plan)">
      <view class="plan-header">
        <text class="plan-title">{{ plan.title }}</text>
        <text class="plan-delete" @click.stop="removePlan(plan.id)">删除</text>
      </view>
      <text class="plan-desc" v-if="plan.description">{{ plan.description }}</text>
      <view class="plan-meta">
        <text class="plan-period">{{ plan.rangeStart }} ~ {{ plan.rangeEnd }}</text>
        <text class="plan-target">每日目标: {{ plan.targetHours }}h</text>
      </view>
      <view class="plan-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: plan.progress + '%' }"></view>
        </view>
        <text class="progress-text">{{ plan.progress }}%</text>
      </view>
      <text class="plan-done">已学 {{ plan.doneText }} · 目标 {{ plan.goalText }}</text>
    </view>

    <view class="fab" @click="openForm">
      <text class="fab-icon">+</text>
    </view>

    <view v-if="showForm" class="modal-mask" @click="showForm = false">
      <view class="modal" @click.stop>
        <text class="modal-title">{{ editingPlan ? '编辑计划' : '新建计划' }}</text>
        <view class="input-wrap">
          <input class="modal-input" v-model="form.title" placeholder="计划名称" />
        </view>
        <view class="input-wrap">
          <input class="modal-input" v-model="form.description" placeholder="计划描述（可选）" />
        </view>
        <view class="modal-row">
          <text>开始日期</text>
          <picker mode="date" :value="form.startDate" @change="e => form.startDate = e.detail.value">
            <text class="picker-text">{{ form.startDate || '选择日期' }}</text>
          </picker>
        </view>
        <view class="modal-row">
          <text>结束日期</text>
          <picker mode="date" :value="form.endDate" @change="e => form.endDate = e.detail.value">
            <text class="picker-text">{{ form.endDate || '选择日期' }}</text>
          </picker>
        </view>
        <view class="modal-row">
          <text>每日目标(小时)</text>
          <view class="input-wrap-sm">
            <input class="modal-input-sm" v-model="form.targetHours" type="digit" placeholder="如 2" />
          </view>
        </view>
        <view class="modal-actions">
          <button class="btn-cancel" @click="showForm = false">取消</button>
          <button class="btn-confirm" @click="confirmPlan">确定</button>
        </view>
      </view>
    </view>

    <view v-if="showPreset" class="modal-mask" @click="showPreset = false">
      <view class="modal preset-modal" @click.stop>
        <text class="modal-title">一键生成推荐计划</text>
        <text class="preset-tip">选择你的人群，自动创建对应科目与学习计划</text>
        <view class="preset-list">
          <view v-for="p in presets" :key="p.key" class="preset-item" @click="usePreset(p)">
            <view class="preset-icon" :style="{ background: p.color }">{{ p.icon }}</view>
            <view class="preset-info">
              <text class="preset-name">{{ p.name }}</text>
              <text class="preset-summary">{{ p.summary }}</text>
            </view>
            <text class="preset-arrow">›</text>
          </view>
        </view>
        <view class="modal-actions">
          <button class="btn-cancel" @click="showPreset = false">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getPlans, getRecordsByRange, savePlan, deletePlan, getTodayStr } from '../../utils/storage'
import { PLAN_PRESETS, applyPreset } from '../../utils/presets'

const presets = PLAN_PRESETS
const plans = ref([])
const showForm = ref(false)
const showPreset = ref(false)
const editingPlan = ref(null)
const form = ref({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  targetHours: '2'
})

function loadPlans() {
  plans.value = getPlans()
}

function usePreset(preset) {
  applyPreset(preset)
  showPreset.value = false
  loadPlans()
  uni.showToast({ title: preset.name + '计划已生成', icon: 'success' })
}

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

function getPlanRange(plan) {
  let start = plan.startDate
  if (!start && plan.createdAt) start = fmtDate(new Date(plan.createdAt))
  if (!start) start = getTodayStr()
  let end = plan.endDate
  if (!end) {
    const d = parseDate(start)
    d.setDate(d.getDate() + 29)
    end = fmtDate(d)
  }
  return { start, end }
}

function diffDays(start, end) {
  const s = parseDate(start)
  const e = parseDate(end)
  return Math.max(1, Math.round((e - s) / 86400000) + 1)
}

function fmtHours(seconds) {
  const h = seconds / 3600
  if (h <= 0) return '0h'
  return (Math.round(h * 10) / 10) + 'h'
}

const planViews = computed(() => {
  return plans.value.map(plan => {
    const { start, end } = getPlanRange(plan)
    const seconds = getRecordsByRange(start, end).reduce((s, r) => s + r.duration, 0)
    const goalSeconds = (Number(plan.targetHours) || 0) * 3600 * diffDays(start, end)
    const progress = goalSeconds > 0 ? Math.min(100, Math.round((seconds / goalSeconds) * 100)) : 0
    return {
      ...plan,
      rangeStart: start,
      rangeEnd: end,
      progress,
      doneText: fmtHours(seconds),
      goalText: fmtHours(goalSeconds)
    }
  })
})

function openForm() {
  editingPlan.value = null
  form.value = { title: '', description: '', startDate: '', endDate: '', targetHours: '2' }
  showForm.value = true
}

function editPlan(plan) {
  editingPlan.value = plan
  form.value = {
    title: plan.title,
    description: plan.description || '',
    startDate: plan.startDate || '',
    endDate: plan.endDate || '',
    targetHours: String(plan.targetHours || '')
  }
  showForm.value = true
}

function removePlan(id) {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复',
    success: (res) => {
      if (res.confirm) {
        deletePlan(id)
        loadPlans()
      }
    }
  })
}

function confirmPlan() {
  if (!form.value.title) {
    uni.showToast({ title: '请输入计划名称', icon: 'none' })
    return
  }
  const data = {
    title: form.value.title,
    description: form.value.description,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    targetHours: parseFloat(form.value.targetHours) || 0
  }
  if (editingPlan.value) data.id = editingPlan.value.id
  savePlan(data)
  showForm.value = false
  form.value = { title: '', description: '', startDate: '', endDate: '', targetHours: '2' }
  editingPlan.value = null
  loadPlans()
  uni.showToast({ title: '保存成功', icon: 'success' })
}

onShow(() => {
  loadPlans()
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.preset-entry {
  font-size: 26rpx;
  color: #667eea;
  padding: 8rpx 20rpx;
  background: #eef1ff;
  border-radius: 30rpx;
}
.preset-modal {
  padding: 36rpx 30rpx 30rpx;
}
.preset-tip {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #999;
  margin: -12rpx 0 24rpx;
}
.preset-list {
  max-height: 680rpx;
  overflow-y: auto;
}
.preset-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  background: #f7f8fc;
  border-radius: 16rpx;
}
.preset-item:last-child {
  margin-bottom: 0;
}
.preset-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 22rpx;
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6rpx 16rpx rgba(31, 41, 55, 0.15);
}
.preset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.preset-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #2b2f3a;
}
.preset-summary {
  font-size: 23rpx;
  color: #8a90a0;
  margin-top: 6rpx;
}
.preset-arrow {
  font-size: 40rpx;
  color: #c0c4d0;
  line-height: 1;
  flex-shrink: 0;
}
.page-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
}
.empty-img {
  width: 160rpx;
  height: 160rpx;
  opacity: 0.3;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}

.plan-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.plan-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
.plan-delete {
  font-size: 24rpx;
  color: #e74c3c;
  padding: 8rpx 16rpx;
}
.plan-desc {
  font-size: 26rpx;
  color: #666;
  margin-top: 10rpx;
  display: block;
}
.plan-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
}
.plan-period, .plan-target {
  font-size: 24rpx;
  color: #999;
}
.plan-progress {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  gap: 16rpx;
}
.progress-bar {
  flex: 1;
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 6rpx;
  transition: width 0.3s;
}
.progress-text {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 600;
}
.plan-done {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 10rpx;
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: 100rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(102,126,234,0.4);
}
.fab-icon {
  font-size: 48rpx;
  color: #fff;
  line-height: 1;
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
  margin-bottom: 30rpx;
  display: block;
  text-align: center;
}
.input-wrap {
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
}
.modal-input {
  width: 100%;
  font-size: 28rpx;
}
.input-wrap-sm {
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  width: 160rpx;
}
.modal-input-sm {
  width: 100%;
  font-size: 28rpx;
  text-align: center;
}
.modal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #333;
}
.picker-text {
  color: #667eea;
  padding: 12rpx 20rpx;
  background: #f5f7fa;
  border-radius: 8rpx;
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
.plan-card {
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(31, 41, 55, 0.06);
}
.modal {
  border-radius: 24rpx;
}
.page-title {
  font-weight: 700;
  color: #2b2f3a;
}
</style>
