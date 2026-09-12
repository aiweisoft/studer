import { getPlans, getSubjects, savePlan, saveSubject } from './storage'

export const PLAN_PRESETS = [
  {
    key: 'primary',
    name: '小学生',
    icon: '小',
    color: '#f39c12',
    summary: '打基础、养习惯，每日 1.5 小时',
    subjects: [
      { name: '语文', color: '#e74c3c' },
      { name: '数学', color: '#3498db' },
      { name: '英语', color: '#f39c12' }
    ],
    plans: [
      {
        title: '小学每日基础巩固',
        description: '语文朗读与生字 20 分钟；数学口算与应用题 30 分钟；英语单词与听力 20 分钟；课外阅读 20 分钟。',
        targetHours: 1.5,
        durationDays: 30
      }
    ]
  },
  {
    key: 'junior',
    name: '中学生',
    icon: '中',
    color: '#e74c3c',
    summary: '梳理知识、整理错题，每日 3 小时',
    subjects: [
      { name: '语文', color: '#e74c3c' },
      { name: '数学', color: '#3498db' },
      { name: '英语', color: '#f39c12' },
      { name: '物理', color: '#9b59b6' },
      { name: '化学', color: '#2ecc71' }
    ],
    plans: [
      {
        title: '中考备战计划',
        description: '每日主攻 2 门学科：课本知识梳理 + 错题整理；周末完成一套模拟卷并总结错误类型。',
        targetHours: 3,
        durationDays: 30
      }
    ]
  },
  {
    key: 'senior',
    name: '高中生',
    icon: '高',
    color: '#9b59b6',
    summary: '专项突破、模拟实战，每日 4 小时',
    subjects: [
      { name: '语文', color: '#e74c3c' },
      { name: '数学', color: '#3498db' },
      { name: '英语', color: '#f39c12' },
      { name: '物理', color: '#9b59b6' },
      { name: '化学', color: '#2ecc71' },
      { name: '生物', color: '#1abc9c' }
    ],
    plans: [
      {
        title: '高考冲刺计划',
        description: '每日各科专项训练，晚间错题复盘；周末完成一套综合卷，并针对薄弱题型加练。',
        targetHours: 4,
        durationDays: 30
      }
    ]
  },
  {
    key: 'college',
    name: '大学生',
    icon: '大',
    color: '#3498db',
    summary: '专业课程 + 四六级 + 考研考证',
    subjects: [
      { name: '专业课', color: '#3498db' },
      { name: '英语四六级', color: '#f39c12' },
      { name: '考研/考证', color: '#9b59b6' },
      { name: '技能拓展', color: '#2ecc71' }
    ],
    plans: [
      {
        title: '大学课程与四六级',
        description: '专业课复习与作业 1.5 小时；四六级词汇与真题 1 小时；专业拓展阅读 0.5 小时。',
        targetHours: 3,
        durationDays: 30
      },
      {
        title: '考研/考证备考',
        description: '拆分阶段目标，每日固定时段刷题与背诵；每周日做一次模拟测试并复盘。',
        targetHours: 2,
        durationDays: 90
      }
    ]
  },
  {
    key: 'worker',
    name: '上班族',
    icon: '职',
    color: '#2ecc71',
    summary: '职场充电 + 阅读提升，利用碎片时间',
    subjects: [
      { name: '职业技能', color: '#2ecc71' },
      { name: '外语', color: '#f39c12' },
      { name: '考证', color: '#9b59b6' },
      { name: '阅读', color: '#3498db' }
    ],
    plans: [
      {
        title: '职场充电计划',
        description: '通勤时间听外语/播客；晚间专业技能学习 1 小时；周末系统学习考证科目并做题。',
        targetHours: 2,
        durationDays: 30
      },
      {
        title: '阅读与自我提升',
        description: '每日阅读 30 分钟并做笔记；每周输出一篇学习总结，回顾本周收获与不足。',
        targetHours: 1,
        durationDays: 30
      }
    ]
  }
]

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function applyPreset(preset) {
  const existingSubjects = getSubjects()
  preset.subjects.forEach(s => {
    if (!existingSubjects.find(e => e.name === s.name)) {
      saveSubject({ name: s.name, color: s.color })
    }
  })
  const existingPlans = getPlans()
  const today = new Date()
  preset.plans.forEach(p => {
    if (existingPlans.find(e => e.title === p.title)) return
    savePlan({
      title: p.title,
      description: p.description,
      startDate: formatDate(today),
      endDate: formatDate(addDays(today, p.durationDays || 30)),
      targetHours: p.targetHours
    })
  })
}
