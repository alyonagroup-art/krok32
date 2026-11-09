import type { Difficulty, ExerciseTemplate, Problem, ProgressState, Subject, Topic } from './types'
import { createRng, randomSeed } from './rng'
import { MASTERED_AT, effectiveMastery, isDue } from './progress'

/** Індекс тем по id (для будь-якої кількості предметів). */
export function indexTopics(subjects: Subject[]): Map<string, Topic> {
  const map = new Map<string, Topic>()
  for (const s of subjects) for (const t of s.topics) map.set(t.id, t)
  return map
}

export function isReady(topic: Topic): boolean {
  return !topic.stub && topic.exercises.length > 0 && topic.lesson.length > 0
}

export function topicsOf(subject: Subject, grade?: number): Topic[] {
  return subject.topics.filter((t) => grade === undefined || t.grade === grade)
}

/** Усі (транзитивні) передумови теми у порядку «від базових до безпосередніх». */
export function prerequisitesOf(topicId: string, index: Map<string, Topic>): Topic[] {
  const seen = new Set<string>()
  const order: Topic[] = []
  const visit = (id: string) => {
    if (seen.has(id)) return
    seen.add(id)
    const t = index.get(id)
    if (!t) return
    t.prereqs.forEach(visit)
    if (id !== topicId) order.push(t)
  }
  visit(topicId)
  return order
}

/** Передумови, які учень ще не освоїв достатньо (для підказки «спершу повтори це»). */
export function prerequisiteGaps(topicId: string, index: Map<string, Topic>, state: ProgressState, threshold = 0.6, now = new Date()): Topic[] {
  return prerequisitesOf(topicId, index).filter((t) => isReady(t) && effectiveMastery(state.topics[t.id], now) < threshold)
}

/** Прямі передумови (один рівень). */
export function directPrereqs(topic: Topic, index: Map<string, Topic>): Topic[] {
  return topic.prereqs.map((id) => index.get(id)).filter((t): t is Topic => !!t)
}

/** Теми, які відкриваються після цієї. */
export function dependents(topicId: string, subjects: Subject[]): Topic[] {
  return subjects.flatMap((s) => s.topics).filter((t) => t.prereqs.includes(topicId))
}

export interface Recommendation {
  topic: Topic
  reason: 'due' | 'continue' | 'flagged' | 'next'
}

/** Що вчити далі: повторення → недовчене → позначене → наступна нова тема. */
export function recommend(subject: Subject, index: Map<string, Topic>, state: ProgressState, now = new Date(), limit = 5): Recommendation[] {
  const out: Recommendation[] = []
  const seen = new Set<string>()
  const push = (t: Topic | undefined, reason: Recommendation['reason']) => {
    if (!t || seen.has(t.id) || !isReady(t)) return
    seen.add(t.id)
    out.push({ topic: t, reason })
  }
  const mine = new Map(subject.topics.map((t) => [t.id, t]))
  for (const [id, p] of Object.entries(state.topics)) if (isDue(p, now) && mine.has(id)) push(mine.get(id), 'due')
  for (const [id, p] of Object.entries(state.topics)) {
    if (mine.has(id) && p.attempts > 0 && effectiveMastery(p, now) < 0.7) push(mine.get(id), 'continue')
  }
  for (const id of state.flagged) push(mine.get(id), 'flagged')
  const grade = state.profile.grade
  const ordered = [...subject.topics].sort((a, b) => Math.abs(a.grade - grade) - Math.abs(b.grade - grade) || subject.topics.indexOf(a) - subject.topics.indexOf(b))
  for (const t of subject.topics.filter((t) => t.grade === grade).concat(ordered)) {
    if (out.length >= limit) break
    if (state.topics[t.id]?.attempts) continue
    const ready = t.prereqs.every((id) => !index.get(id) || !isReady(index.get(id)!) || effectiveMastery(state.topics[id], now) >= 0.5)
    if (ready) push(t, 'next')
  }
  return out.slice(0, limit)
}

// ───────────────────────── Вибір задач ─────────────────────────

export interface GeneratedProblem {
  topicId: string
  templateId: string
  seed: number
  difficulty: Difficulty
  skill: string
  problem: Problem
}

export function generateFromTemplate(topic: Topic, template: ExerciseTemplate, seed: number): GeneratedProblem {
  const problem = template.generate(createRng(seed))
  return { topicId: topic.id, templateId: template.id, seed, difficulty: template.difficulty, skill: template.skill, problem }
}

/** Відновити задачу за (тема, шаблон, seed). */
export function regenerate(topic: Topic, templateId: string, seed: number): GeneratedProblem {
  const t = topic.exercises.find((e) => e.id === templateId)
  if (!t) throw new Error(`Unknown template ${templateId} in ${topic.id}`)
  return generateFromTemplate(topic, t, seed)
}

function difficultyWeights(mastery: number): Record<Difficulty, number> {
  if (mastery < 0.35) return { 1: 0.7, 2: 0.25, 3: 0.05 }
  if (mastery < 0.7) return { 1: 0.25, 2: 0.5, 3: 0.25 }
  return { 1: 0.1, 2: 0.4, 3: 0.5 }
}

function weightedPick<T>(items: T[], weights: number[], r: number): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let x = r * total
  for (let i = 0; i < items.length; i++) {
    x -= weights[i]
    if (x <= 0) return items[i]
  }
  return items[items.length - 1]
}

export interface NextProblemOptions {
  /** id шаблонів, які були нещодавно (щоб не повторювати підряд) */
  recent?: string[]
  /** примусова складність (діагностика, тест) */
  difficulty?: Difficulty
  seed?: number
  now?: Date
}

/** Адаптивний вибір наступної задачі: складність за рівнем володіння, слабкі типи частіше. */
export function nextProblem(topic: Topic, state: ProgressState, opts: NextProblemOptions = {}): GeneratedProblem {
  if (topic.exercises.length === 0) throw new Error(`Topic ${topic.id} has no exercises`)
  const seed = opts.seed ?? randomSeed()
  const picker = createRng(seed ^ 0x9e3779b9)
  const p = state.topics[topic.id]
  const m = effectiveMastery(p, opts.now)
  const wDiff = difficultyWeights(m)
  const recent = opts.recent ?? []
  const weights = topic.exercises.map((e) => {
    let w = opts.difficulty ? (e.difficulty === opts.difficulty ? 1 : 0.05) : wDiff[e.difficulty]
    if (p?.weakSkills?.[e.skill]) w *= 2
    const idx = recent.lastIndexOf(e.id)
    if (idx >= 0) w *= idx >= recent.length - 1 ? 0.05 : 0.4
    return Math.max(w, 0.001)
  })
  const tpl = weightedPick(topic.exercises, weights, picker.next())
  return generateFromTemplate(topic, tpl, seed)
}

/** Набір для тесту теми: суміш складностей, без повторів шаблонів, поки є з чого вибирати. */
export function buildTest(topic: Topic, count = 8, seed = randomSeed()): GeneratedProblem[] {
  const rng = createRng(seed)
  const byDiff: Record<Difficulty, ExerciseTemplate[]> = { 1: [], 2: [], 3: [] }
  topic.exercises.forEach((e) => byDiff[e.difficulty].push(e))
  const plan: Difficulty[] = []
  const share: [Difficulty, number][] = [[1, 0.3], [2, 0.45], [3, 0.25]]
  for (const [d, f] of share) for (let i = 0; i < Math.round(count * f); i++) plan.push(d)
  while (plan.length < count) plan.push(2)
  plan.length = count
  const used = new Map<string, number>()
  const result: GeneratedProblem[] = []
  for (const d of plan) {
    let pool = byDiff[d].length ? byDiff[d] : topic.exercises
    const minUse = Math.min(...pool.map((e) => used.get(e.id) ?? 0))
    pool = pool.filter((e) => (used.get(e.id) ?? 0) === minUse)
    const tpl = rng.pick(pool)
    used.set(tpl.id, (used.get(tpl.id) ?? 0) + 1)
    result.push(generateFromTemplate(topic, tpl, rng.int(1, 2 ** 30)))
  }
  return result
}

/** Діагностика: по одній задачі базової/середньої складності з кожної теми. */
export function buildDiagnostic(topics: Topic[], seed = randomSeed()): GeneratedProblem[] {
  const rng = createRng(seed)
  return topics.filter(isReady).map((t) => {
    const easy = t.exercises.filter((e) => e.difficulty <= 2)
    const tpl = rng.pick(easy.length ? easy : t.exercises)
    return generateFromTemplate(t, tpl, rng.int(1, 2 ** 30))
  })
}

/** Сесія повторення теми: 3 задачі, складність за рівнем. */
export function buildReview(topic: Topic, state: ProgressState, count = 3, seed = randomSeed()): GeneratedProblem[] {
  const rng = createRng(seed)
  const out: GeneratedProblem[] = []
  const recent: string[] = []
  for (let i = 0; i < count; i++) {
    const g = nextProblem(topic, state, { recent, seed: rng.int(1, 2 ** 30) })
    recent.push(g.templateId)
    out.push(g)
  }
  return out
}

export function isMastered(state: ProgressState, topicId: string, now = new Date()): boolean {
  return effectiveMastery(state.topics[topicId], now) >= MASTERED_AT
}
