import type { AnswerSpec, Rng, Topic, Chapter, Subject, ExerciseTemplate, Difficulty, Problem } from '@krok/core'

/** Фабрика тем для одного предмета та класу: topic('a7-ch1', { id, title, ... }). */
export function topicFactory(subject: string, grade: number) {
  return (chapter: string, def: Omit<Topic, 'subject' | 'grade' | 'chapter'>): Topic => ({ ...def, subject, grade, chapter })
}

/** Скорочення для шаблону задачі. */
export function exercise(id: string, difficulty: Difficulty, skill: string, generate: (rng: Rng) => Problem): ExerciseTemplate {
  return { id, difficulty, skill, generate }
}

/**
 * Задача з вибором відповіді: варіанти перемішуються автоматично.
 * correct — правильні варіанти, wrong — помилкові (унікальні, не збігаються з правильними).
 */
export function choiceAnswer(rng: Rng, correct: string | string[], wrong: string[], multiple = false): AnswerSpec {
  const right = Array.isArray(correct) ? correct : [correct]
  const uniqueWrong = [...new Set(wrong)].filter((w) => !right.includes(w))
  const all = rng.shuffle([...right.map((text) => ({ text, ok: true })), ...uniqueWrong.map((text) => ({ text, ok: false }))])
  return {
    kind: 'choice',
    options: all.map((o) => o.text),
    correct: all.flatMap((o, i) => (o.ok ? [i] : [])),
    multiple: multiple || right.length > 1,
  }
}

export type { Chapter, Subject }
