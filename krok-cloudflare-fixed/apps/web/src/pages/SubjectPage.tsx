import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { effectiveMastery, isReady, topicStatus } from '@krok/core'
import { getSubject } from '@krok/content'
import { useProgress } from '../store'
import { GRADE_LABEL, MasteryBar, StatusDot, STATUS_LABEL } from '../components/ui'

export function SubjectPage() {
  const { id } = useParams()
  const subject = getSubject(id ?? '')
  const progress = useProgress()
  const [grade, setGrade] = useState<number>(() => (subject?.grades.includes(progress.profile.grade) ? progress.profile.grade : subject?.grades[0] ?? 10))
  const chapters = useMemo(() => subject?.chapters.filter((c) => c.grade === grade) ?? [], [subject, grade])
  if (!subject) return <div className="page"><h1>Предмет не знайдено</h1><Link to="/">На головну</Link></div>

  const gradeTopics = subject.topics.filter((t) => t.grade === grade)
  const ready = gradeTopics.filter(isReady)
  const mastered = ready.filter((t) => effectiveMastery(progress.topics[t.id]) >= 0.8).length

  return (
    <div className="page" style={{ ['--accent' as string]: subject.color }}>
      <header className="page-head">
        <h1>
          <span className="subject-icon small" aria-hidden="true">{subject.icon}</span> {subject.title}
        </h1>
        <p className="lead">{subject.description}</p>
      </header>

      <div className="tabs" role="tablist" aria-label="Клас">
        {subject.grades.map((g) => (
          <button key={g} role="tab" aria-selected={g === grade} className={`tab ${g === grade ? 'on' : ''}`} onClick={() => setGrade(g)}>
            {GRADE_LABEL(g)}
          </button>
        ))}
      </div>

      <div className="grade-summary">
        <span>
          Готово тем: <b>{ready.length}</b> із {gradeTopics.length} · освоєно <b>{mastered}</b>
        </span>
        <Link className="btn small" to={`/diagnostic?subject=${subject.id}&grade=${grade}`}>
          Діагностика класу
        </Link>
      </div>

      {chapters.map((ch) => (
        <section key={ch.id} className="chapter">
          <h2>{ch.title}</h2>
          <ul className="topic-list">
            {gradeTopics
              .filter((t) => t.chapter === ch.id)
              .map((t) => {
                const p = progress.topics[t.id]
                const st = topicStatus(p)
                const stub = !isReady(t)
                return (
                  <li key={t.id} className={stub ? 'stub' : ''}>
                    <Link to={`/t/${t.id}`} className="topic-row">
                      <StatusDot progress={p} />
                      <span className="topic-title">{t.title}</span>
                      <span className="topic-meta">
                        {stub ? <span className="chip">скоро</span> : <span className="muted small">{t.estMinutes} хв</span>}
                        {!stub && st !== 'new' && <span className="muted small">{STATUS_LABEL[st]}</span>}
                      </span>
                      {!stub && <MasteryBar progress={p} />}
                    </Link>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}
