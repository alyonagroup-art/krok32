import type { Chapter, Topic } from '@krok/core'

/** Опис теми в карті програми (до того, як написано повні матеріали). */
export interface TopicDef {
  id: string
  grade: number
  chapter: string
  title: string
  pre: string[]
  minutes: number
  summary: string
}

export const def = (id: string, grade: number, chapter: string, title: string, pre: string[], minutes: number, summary: string): TopicDef => ({
  id,
  grade,
  chapter,
  title,
  pre,
  minutes,
  summary,
})

/** Заготовка теми («скоро»): видима на карті, але без матеріалів. */
export function stubTopic(subject: string, d: TopicDef): Topic {
  return {
    id: d.id,
    subject,
    grade: d.grade,
    chapter: d.chapter,
    title: d.title,
    summary: d.summary,
    prereqs: d.pre,
    estMinutes: d.minutes,
    lesson: [],
    examples: [],
    exercises: [],
    stub: true,
  }
}

/** Об'єднати карту програми з написаними темами: написана тема замінює заготовку з тим самим id. */
export function mergeCurriculum(subject: string, skeleton: TopicDef[], authored: Topic[]): Topic[] {
  const byId = new Map(authored.map((t) => [t.id, t]))
  const merged = skeleton.map((d) => {
    const a = byId.get(d.id)
    if (!a) return stubTopic(subject, d)
    byId.delete(d.id)
    // карта програми — джерело правди щодо місця теми у дереві
    return { ...a, subject, grade: d.grade, chapter: d.chapter, prereqs: d.pre }
  })
  // теми, яких немає в карті (додані автором понад програму), додаються в кінець
  for (const extra of byId.values()) merged.push({ ...extra, subject })
  return merged
}

export const chap = (id: string, grade: number, title: string): Chapter => ({ id, grade, title })
