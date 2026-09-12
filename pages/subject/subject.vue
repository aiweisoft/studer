<template>
  <view class="page">
    <view class="header">
      <text class="page-title">学习科目</text>
    </view>

    <view v-if="subjects.length === 0" class="empty">
      <text class="empty-text">还没有学习科目，添加一个吧！</text>
    </view>

    <view v-for="subject in subjects" :key="subject.id" class="subject-card">
      <view class="subject-left">
        <view class="color-dot" :style="{ background: subject.color }"></view>
        <view class="subject-info">
          <text class="subject-name">{{ subject.name }}</text>
          <text class="subject-stats">今日 {{ getTodayHours(subject.id) }}h · 共 {{ getTotalHours(subject.id) }}h</text>
        </view>
      </view>
      <view class="subject-actions">
        <text class="action-btn" @click="editSubject(subject)">编辑</text>
        <text class="action-btn danger" @click="removeSubject(subject.id)">删除</text>
      </view>
    </view>

    <view class="fab" @click="showForm = true; editingSubject = null">
      <text class="fab-icon">+</text>
    </view>

    <view v-if="showForm" class="modal-mask" @click="showForm = false">
      <view class="modal" @click.stop>
        <text class="modal-title">{{ editingSubject ? '编辑科目' : '添加科目' }}</text>
        <input class="modal-input" v-model="form.name" placeholder="科目名称（如 英语、数学）" />
        <view class="color-picker">
          <text>选择颜色</text>
          <view class="color-options">
            <view v-for="c in colors" :key="c" class="color-item" :class="{ active: form.color === c }"
              :style="{ background: c }" @click="form.color = c">
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button class="btn-cancel" @click="showForm = false">取消</button>
          <button class="btn-confirm" @click="confirmSubject">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSubjects, getRecordsBySubject, getRecordsByDate, saveSubject, deleteSubject, getTodayStr } from '../../utils/storage'

const subjects = ref([])
const showForm = ref(false)
const editingSubject = ref(null)
const form = ref({ name: '', color: '#667eea' })
const colors = ['#667eea', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#3498db']

const todayStr = getTodayStr()

function loadSubjects() {
  subjects.value = getSubjects()
}

function getTodayHours(id) {
  const todayRecords = getRecordsByDate(todayStr).filter(r => r.subjectId === id)
  const total = todayRecords.reduce((s, r) => s + r.duration, 0)
  return (total / 3600).toFixed(1)
}

function getTotalHours(id) {
  const records = getRecordsBySubject(id)
  const total = records.reduce((s, r) => s + r.duration, 0)
  return (total / 3600).toFixed(1)
}

function editSubject(subject) {
  editingSubject.value = subject
  form.value = { name: subject.name, color: subject.color }
  showForm.value = true
}

function removeSubject(id) {
  uni.showModal({
    title: '确认删除',
    content: '删除科目不会删除相关学习记录',
    success: (res) => {
      if (res.confirm) {
        deleteSubject(id)
        loadSubjects()
      }
    }
  })
}

function confirmSubject() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入科目名称', icon: 'none' })
    return
  }
  const data = { name: form.value.name.trim(), color: form.value.color }
  if (editingSubject.value) data.id = editingSubject.value.id
  saveSubject(data)
  showForm.value = false
  form.value = { name: '', color: '#667eea' }
  editingSubject.value = null
  loadSubjects()
  uni.showToast({ title: '保存成功', icon: 'success' })
}

onShow(() => {
  loadSubjects()
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
  justify-content: center;
  padding-top: 160rpx;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
}

.subject-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.subject-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.color-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
}
.subject-info {
  display: flex;
  flex-direction: column;
}
.subject-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
.subject-stats {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}
.subject-actions {
  display: flex;
  gap: 16rpx;
}
.action-btn {
  font-size: 24rpx;
  color: #667eea;
  padding: 8rpx 16rpx;
}
.action-btn.danger {
  color: #e74c3c;
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
.color-picker {
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #333;
}
.color-options {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}
.color-item {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  border: 4rpx solid transparent;
}
.color-item.active {
  border-color: #333;
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
