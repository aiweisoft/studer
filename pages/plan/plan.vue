<template>
  <view class="page">
    <view class="header">
      <text class="page-title">学习计划</text>
    </view>

    <view v-if="plans.length === 0" class="empty">
      <image class="empty-img" src="" mode="aspectFit"></image>
      <text class="empty-text">还没有学习计划，创建一个吧！</text>
    </view>

    <view v-for="plan in plans" :key="plan.id" class="plan-card" @click="editPlan(plan)">
      <view class="plan-header">
        <text class="plan-title">{{ plan.title }}</text>
        <text class="plan-delete" @click.stop="removePlan(plan.id)">删除</text>
      </view>
      <text class="plan-desc" v-if="plan.description">{{ plan.description }}</text>
      <view class="plan-meta">
        <text class="plan-period">{{ plan.startDate }} ~ {{ plan.endDate }}</text>
        <text class="plan-target">每日目标: {{ plan.targetHours }}h</text>
      </view>
      <view class="plan-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: getProgress(plan) + '%' }"></view>
        </view>
        <text class="progress-text">{{ getProgress(plan) }}%</text>
      </view>
    </view>

    <view class="fab" @click="showForm = true; editingPlan = null">
      <text class="fab-icon">+</text>
    </view>

    <view v-if="showForm" class="modal-mask" @click="showForm = false">
      <view class="modal" @click.stop>
        <text class="modal-title">{{ editingPlan ? '编辑计划' : '新建计划' }}</text>
        <input class="modal-input" v-model="form.title" placeholder="计划名称" />
        <input class="modal-input" v-model="form.description" placeholder="计划描述（可选）" />
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
          <input class="modal-input-sm" v-model="form.targetHours" type="digit" placeholder="如 2" />
        </view>
        <view class="modal-actions">
          <button class="btn-cancel" @click="showForm = false">取消</button>
          <button class="btn-confirm" @click="confirmPlan">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getPlans, getRecordsByPlan, savePlan, deletePlan } from '../../utils/storage'

const plans = ref([])
const showForm = ref(false)
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

function getProgress(plan) {
  const records = getRecordsByPlan(plan.id)
  const totalMin = records.reduce((s, r) => s + r.duration, 0) / 60
  const totalDays = records.length
  if (totalDays === 0 || !plan.targetHours) return 0
  const expectedMin = totalDays * plan.targetHours * 60
  if (expectedMin === 0) return 0
  return Math.min(Math.round((totalMin / expectedMin) * 100), 100)
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
.modal-input {
  width: 100%;
  padding: 20rpx 24rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  margin-bottom: 20rpx;
  box-sizing: border-box;
}
.modal-input-sm {
  width: 120rpx;
  padding: 16rpx 20rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
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
.btn-cancel {
  flex: 1;
  background: #f0f0f0;
  color: #666;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.btn-confirm {
  flex: 1;
  background: #667eea;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}
</style>
