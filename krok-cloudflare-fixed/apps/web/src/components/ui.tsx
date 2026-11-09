import type { TopicProgress } from '@krok/core'
import { effectiveMastery, topicStatus } from '@krok/core'
import type { TopicStatus } from '@krok/core'

export const STATUS_LABEL: Record<TopicStatus, string> = {
  new: 'Нова',
  learning: 'Вчу',
  familiar: 'Знайома',
  mastered: 'Освоєна',
}

export function StatusDot({ progress }: { progress?: TopicProgress }) {
  const st = topicStatus(progress)
  return <span className={`dot ${st}`} title={STATUS_LABEL[st]} aria-label={STATUS_LABEL[st]} />
}

export function MasteryBar({ progress, label }: { progress?: TopicProgress; label?: boolean }) {
  const m = effectiveMastery(progress)
  const st = topicStatus(progress)
  return (
    <div className="mastery" title={`Освоєння: ${Math.round(m * 100)}%`}>
      <div className={`mastery-fill ${st}`} style={{ width: `${Math.round(m * 100)}%` }} />
      {label && <span className="mastery-label">{STATUS_LABEL[st]}</span>}
    </div>
  )
}

export function relativeDay(iso?: string): string {
  if (!iso) return ''
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000)
  if (days < -1) return `прострочено на ${-days} дн.`
  if (days <= 0) return 'сьогодні'
  if (days === 1) return 'завтра'
  return `через ${days} дн.`
}

export const GRADE_LABEL = (g: number) => (g === 6 ? '5–6 кл. (база)' : `${g} клас`)
