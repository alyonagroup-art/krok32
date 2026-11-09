import type { ActivityDay, AttemptResult, ProgressState, TopicProgress } from './types'

/**
 * Трекінг освоєння тем + інтервальне повторення.
 * Усі функції чисті (повертають новий стан) — зручно і для React, і для бота.
 */

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60, 120]
export const MASTERED_AT = 0.8
export const FAMILIAR_AT = 0.5
const SCHEDULE_AT = 0.7

export type TopicStatus = 'new' | 'learning' | 'familiar' | 'mastered'

export function emptyProgress(grade = 10, name = ''): ProgressState {
  return { version: 1, profile: { name, grade }, topics: {}, activity: [], flagged: [] }
}

export function emptyTopicProgress(): TopicProgress {
  return { mastery: 0, attempts: 0, correct: 0, box: 0 }
}

/** YYYY-MM-DD за місцевим часом. */
export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

/** Бал за одну відповідь: чисто = 1, з підказками менше, з показаним розв'язанням = 0. */
export function attemptScore(r: Pick<AttemptResult, 'correct' | 'hintsUsed' | 'solutionShown'>): number {
  if (!r.correct || r.solutionShown) return 0
  return Math.max(0.35, 1 - 0.25 * r.hintsUsed)
}

/** Скільки «пам'яті» залишилось: прострочене повторення знижує показник. */
export function effectiveMastery(p: TopicProgress | undefined, now = new Date()): number {
  if (!p) return 0
  if (!p.due) return p.mastery
  const overdueDays = (now.getTime() - new Date(p.due).getTime()) / 86400000
  if (overdueDays <= 0) return p.mastery
  return p.mastery * Math.max(0.6, 1 - 0.015 * overdueDays)
}

export function topicStatus(p: TopicProgress | undefined, now = new Date()): TopicStatus {
  if (!p || p.attempts === 0) return 'new'
  const m = effectiveMastery(p, now)
  if (m >= MASTERED_AT) return 'mastered'
  if (m >= FAMILIAR_AT) return 'familiar'
  return 'learning'
}

export function isDue(p: TopicProgress | undefined, now = new Date()): boolean {
  return !!p?.due && new Date(p.due).getTime() <= now.getTime()
}

function bumpActivity(list: ActivityDay[], now: Date, correct: boolean): ActivityDay[] {
  const key = dayKey(now)
  const next = list.map((d) => ({ ...d }))
  let day = next.find((d) => d.date === key)
  if (!day) {
    day = { date: key, answered: 0, correct: 0 }
    next.push(day)
  }
  day.answered += 1
  if (correct) day.correct += 1
  return next.sort((a, b) => a.date.localeCompare(b.date)).slice(-180)
}

/** Записує результат відповіді. */
export function applyAttempt(state: ProgressState, r: AttemptResult, now = new Date()): ProgressState {
  const prev = state.topics[r.topicId] ?? emptyTopicProgress()
  const score = attemptScore(r)
  const alpha = r.isTest ? 0.5 : prev.attempts < 3 ? 0.4 : 0.25
  const mastery = prev.mastery + alpha * (score - prev.mastery)
  const next: TopicProgress = {
    ...prev,
    mastery,
    attempts: prev.attempts + 1,
    correct: prev.correct + (r.correct && !r.solutionShown ? 1 : 0),
    lastSeen: now.toISOString(),
  }

  // слабкі типи задач
  const weak = { ...(prev.weakSkills ?? {}) }
  if (!r.correct || r.solutionShown) weak[r.skill] = (weak[r.skill] ?? 0) + 1
  else if (weak[r.skill] && r.hintsUsed === 0) {
    weak[r.skill] -= 1
    if (weak[r.skill] <= 0) delete weak[r.skill]
  }
  next.weakSkills = Object.keys(weak).length ? weak : undefined

  // інтервальне повторення
  const due = prev.due ? new Date(prev.due) : undefined
  if (!due && mastery >= SCHEDULE_AT) {
    next.box = 0
    next.due = addDays(now, REVIEW_INTERVALS_DAYS[0]).toISOString()
  } else if (due && due.getTime() <= now.getTime()) {
    if (score >= 0.7) {
      next.box = Math.min(prev.box + 1, REVIEW_INTERVALS_DAYS.length - 1)
      next.due = addDays(now, REVIEW_INTERVALS_DAYS[next.box]).toISOString()
    } else {
      next.box = Math.max(0, prev.box - 2)
      next.due = addDays(now, 1).toISOString()
    }
  }

  const flagged = state.flagged.filter((id) => id !== r.topicId || mastery < MASTERED_AT)
  return {
    ...state,
    topics: { ...state.topics, [r.topicId]: next },
    activity: bumpActivity(state.activity, now, r.correct && !r.solutionShown),
    flagged,
  }
}

export function markLessonRead(state: ProgressState, topicId: string, now = new Date()): ProgressState {
  const prev = state.topics[topicId] ?? emptyTopicProgress()
  return { ...state, topics: { ...state.topics, [topicId]: { ...prev, lessonRead: true, lastSeen: now.toISOString() } } }
}

export function recordTestScore(state: ProgressState, topicId: string, fraction: number): ProgressState {
  const prev = state.topics[topicId] ?? emptyTopicProgress()
  return { ...state, topics: { ...state.topics, [topicId]: { ...prev, bestTest: Math.max(prev.bestTest ?? 0, fraction) } } }
}

export function flagTopics(state: ProgressState, ids: string[]): ProgressState {
  return { ...state, flagged: [...new Set([...state.flagged, ...ids])] }
}

export function unflagTopic(state: ProgressState, id: string): ProgressState {
  return { ...state, flagged: state.flagged.filter((x) => x !== id) }
}

export function dueTopicIds(state: ProgressState, now = new Date()): string[] {
  return Object.entries(state.topics)
    .filter(([, p]) => isDue(p, now))
    .sort((a, b) => new Date(a[1].due!).getTime() - new Date(b[1].due!).getTime())
    .map(([id]) => id)
}

/** Серія днів поспіль з активністю (включно з сьогодні або вчора). */
export function currentStreak(state: ProgressState, now = new Date()): number {
  const days = new Set(state.activity.filter((d) => d.answered > 0).map((d) => d.date))
  let cursor = now
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Об'єднання двох прогресів (імпорт): для кожної теми беремо ту, де більше спроб. */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const topics: Record<string, TopicProgress> = { ...a.topics }
  for (const [id, p] of Object.entries(b.topics)) {
    if (!topics[id] || p.attempts > topics[id].attempts) topics[id] = p
  }
  const byDate = new Map<string, ActivityDay>()
  for (const d of [...a.activity, ...b.activity]) {
    const ex = byDate.get(d.date)
    if (!ex || d.answered > ex.answered) byDate.set(d.date, d)
  }
  return {
    version: 1,
    profile: a.profile,
    topics,
    activity: [...byDate.values()].sort((x, y) => x.date.localeCompare(y.date)),
    flagged: [...new Set([...a.flagged, ...b.flagged])],
  }
}

export function isProgressState(x: unknown): x is ProgressState {
  const s = x as ProgressState
  return !!s && s.version === 1 && typeof s.topics === 'object' && Array.isArray(s.activity) && !!s.profile
}

/** Адаптер сховища: у браузері — localStorage, у боті — файл/SQLite. */
export interface ProgressStore {
  load(): ProgressState
  save(state: ProgressState): void
}
