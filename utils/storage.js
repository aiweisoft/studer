const KEYS = {
  PLANS: 'studer_plans',
  SUBJECTS: 'studer_subjects',
  RECORDS: 'studer_records'
}

function getData(key) {
  try {
    const data = uni.getStorageSync(key)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

function setData(key, data) {
  uni.setStorageSync(key, JSON.stringify(data))
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getToday() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const start = new Date(now)
  start.setDate(now.getDate() - dayOfWeek + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = d => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { start: fmt(start), end: fmt(end) }
}

function getMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` }
}

export function getPlans() {
  return getData(KEYS.PLANS)
}

export function getPlan(id) {
  return getPlans().find(p => p.id === id)
}

export function savePlan(plan) {
  const plans = getPlans()
  if (plan.id) {
    const idx = plans.findIndex(p => p.id === plan.id)
    if (idx > -1) plans[idx] = { ...plans[idx], ...plan }
  } else {
    plan.id = generateId()
    plan.createdAt = new Date().toISOString()
    plans.push(plan)
  }
  setData(KEYS.PLANS, plans)
  return plan
}

export function deletePlan(id) {
  setData(KEYS.PLANS, getPlans().filter(p => p.id !== id))
}

export function getSubjects() {
  return getData(KEYS.SUBJECTS)
}

export function getSubject(id) {
  return getSubjects().find(s => s.id === id)
}

export function saveSubject(subject) {
  const subjects = getSubjects()
  if (subject.id) {
    const idx = subjects.findIndex(s => s.id === subject.id)
    if (idx > -1) subjects[idx] = { ...subjects[idx], ...subject }
  } else {
    subject.id = generateId()
    subject.createdAt = new Date().toISOString()
    subjects.push(subject)
  }
  setData(KEYS.SUBJECTS, subjects)
  return subject
}

export function deleteSubject(id) {
  setData(KEYS.SUBJECTS, getSubjects().filter(s => s.id !== id))
}

export function getRecords() {
  return getData(KEYS.RECORDS)
}

export function getRecordsByDate(date) {
  return getRecords().filter(r => r.date === date)
}

export function getRecordsByPlan(planId) {
  return getRecords().filter(r => r.planId === planId)
}

export function getRecordsBySubject(subjectId) {
  return getRecords().filter(r => r.subjectId === subjectId)
}

export function getRecordsByRange(startDate, endDate) {
  return getRecords().filter(r => r.date >= startDate && r.date <= endDate)
}

export function saveRecord(record) {
  const records = getRecords()
  if (record.id) {
    const idx = records.findIndex(r => r.id === record.id)
    if (idx > -1) records[idx] = { ...records[idx], ...record }
  } else {
    record.id = generateId()
    records.push(record)
  }
  setData(KEYS.RECORDS, records)
  return record
}

export function deleteRecord(id) {
  setData(KEYS.RECORDS, getRecords().filter(r => r.id !== id))
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = n => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

export function getTodayStr() {
  return getToday()
}

export function getWeekRangeStr() {
  return getWeekRange()
}

export function getMonthRangeStr() {
  return getMonthRange()
}
