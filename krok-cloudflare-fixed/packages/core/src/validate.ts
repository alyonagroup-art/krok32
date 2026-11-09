import type { AnswerSpec, Problem, Subject, Topic } from './types'
import { checkAnswer } from './answers/check'
import { createRng } from './rng'
import { isReady } from './curriculum'

/** Текст, який обов'язково має бути зарахований як правильна відповідь (самоперевірка генераторів). */
export function canonicalInput(spec: AnswerSpec): string {
  switch (spec.kind) {
    case 'number':
      return String(spec.value)
    case 'expression':
    case 'equation':
    case 'interval':
      return spec.value
    case 'numberSet':
      return spec.values.length ? spec.values.join('; ') : 'немає'
    case 'tuple':
      return '(' + spec.values.join('; ') + ')'
    case 'choice':
      return spec.correct.join(',')
    case 'text':
      return spec.accept[0] ?? ''
  }
}

export interface ValidationIssue {
  topicId: string
  where: string
  message: string
}

function checkProblem(topicId: string, where: string, p: Problem, issues: ValidationIssue[]) {
  const add = (message: string) => issues.push({ topicId, where, message })
  if (!p.prompt?.trim()) add('порожня умова')
  if (!Array.isArray(p.hints) || p.hints.length === 0) add('немає підказок')
  if (!Array.isArray(p.solution) || p.solution.length === 0) add('немає розв’язання')
  if (p.answer.kind === 'choice') {
    const { options, correct } = p.answer
    if (options.length < 2) add('choice: менше двох варіантів')
    if (correct.length === 0 || correct.some((i) => i < 0 || i >= options.length)) add('choice: немає правильної відповіді або індекс поза межами')
    if (new Set(options).size !== options.length) add('choice: однакові варіанти')
  }
  const input = canonicalInput(p.answer)
  const r = checkAnswer(p.answer, input)
  if (!r.correct) add(`власна правильна відповідь не зараховується: «${input}» (${r.feedback ?? 'нема пояснення'})`)
  const texts = [p.prompt, ...(p.hints ?? []), ...(p.solution ?? [])]
  for (const t of texts) {
    if ((t.match(/(?<!\\)\$/g) ?? []).length % 2 !== 0) add(`непарна кількість $ у: ${t.slice(0, 60)}`)
    if (/NaN|undefined|Infinity|\[object/.test(t)) add(`у тексті є NaN/undefined: ${t.slice(0, 80)}`)
  }
  p.steps?.forEach((s, i) => {
    const rs = checkAnswer(s.answer, canonicalInput(s.answer))
    if (!rs.correct) add(`крок ${i + 1}: власна відповідь не зараховується (${canonicalInput(s.answer)})`)
    if (/NaN|undefined|Infinity/.test(s.prompt + s.explanation)) add(`крок ${i + 1}: NaN/undefined у тексті`)
  })
}

/** Прогнати всі генератори теми на багатьох seed і зібрати проблеми. */
export function validateTopic(topic: Topic, seedsPerTemplate = 60): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const add = (where: string, message: string) => issues.push({ topicId: topic.id, where, message })
  if (topic.stub) return issues
  if (topic.lesson.length === 0) add('lesson', 'немає теорії')
  if (topic.examples.length === 0) add('examples', 'немає розібраних прикладів')
  if (topic.exercises.length < 3) add('exercises', 'менше 3 шаблонів задач')
  const ids = new Set<string>()
  for (const tpl of topic.exercises) {
    if (ids.has(tpl.id)) add(tpl.id, 'дубль id шаблона')
    ids.add(tpl.id)
    const seen = new Set<string>()
    const issuesBefore = issues.length
    for (let i = 0; i < seedsPerTemplate; i++) {
      if (issues.length - issuesBefore >= 3) break
      const seed = 1000 + i * 7919
      let p: Problem
      try {
        p = tpl.generate(createRng(seed))
      } catch (e) {
        add(tpl.id, `generate кинув помилку при seed=${seed}: ${(e as Error).message}`)
        break
      }
      seen.add(p.prompt)
      checkProblem(topic.id, `${tpl.id}#${seed}`, p, issues)
    }
    if (seen.size < Math.min(8, seedsPerTemplate / 3)) add(tpl.id, `мало різноманітності: лише ${seen.size} різних умов на ${seedsPerTemplate} seed`)
  }
  return issues
}

export function validateSubjects(subjects: Subject[], seeds = 40): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const all = new Map<string, Topic>()
  for (const s of subjects) for (const t of s.topics) all.set(t.id, t)
  for (const s of subjects) {
    for (const t of s.topics) {
      for (const p of t.prereqs) if (!all.has(p)) issues.push({ topicId: t.id, where: 'prereqs', message: `невідома передумова ${p}` })
      if (!s.chapters.some((c) => c.id === t.chapter)) issues.push({ topicId: t.id, where: 'chapter', message: `невідомий розділ ${t.chapter}` })
      if (isReady(t)) issues.push(...validateTopic(t, seeds))
    }
  }
  // цикли у передумовах
  const state = new Map<string, number>()
  const visit = (id: string, path: string[]) => {
    if (state.get(id) === 2) return
    if (state.get(id) === 1) {
      issues.push({ topicId: id, where: 'prereqs', message: `цикл: ${[...path, id].join(' → ')}` })
      return
    }
    state.set(id, 1)
    all.get(id)?.prereqs.forEach((p) => visit(p, [...path, id]))
    state.set(id, 2)
  }
  all.forEach((_t, id) => visit(id, []))
  return issues
}
