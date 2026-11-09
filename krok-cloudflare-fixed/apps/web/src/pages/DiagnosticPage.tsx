import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { buildDiagnostic, createRng, isReady } from '@krok/core'
import type { GeneratedProblem } from '@krok/core'
import { getSubject, subjects } from '@krok/content'
import { progressActions } from '../store'
import { Session } from '../components/Session'
import { GRADE_LABEL } from '../components/ui'

export function DiagnosticPage() {
  const [params] = useSearchParams()
  const initialSubject = params.get('subject') ?? 'algebra'
  const initialGrade = Number(params.get('grade'))
  const [subjectId, setSubjectId] = useState(getSubject(initialSubject) ? initialSubject : 'algebra')
  const [grades, setGrades] = useState<number[]>(initialGrade ? [initialGrade] : [7, 8, 9])
  const [size, setSize] = useState(12)
  const [items, setItems] = useState<GeneratedProblem[] | null>(null)
  const subject = getSubject(subjectId)!
  const pool = useMemo(() => subject.topics.filter((t) => grades.includes(t.grade) && isReady(t)), [subject, grades])

  const start = () => {
    const rng = createRng()
    const chosen = size >= pool.length ? pool : rng.shuffle(pool).slice(0, size)
    setItems(buildDiagnostic(chosen))
  }

  if (items) {
    return (
      <div className="page">
        <Session
          title="Діагностика"
          items={items}
          mode="quiz"
          finishLabel="Позначити слабкі теми і закрити"
          summaryExtra={(res) => {
            const weak = res.filter((r) => !r.correct)
            return weak.length ? (
              <div className="callout warning">
                <div className="callout-title">Теми, які варто повторити</div>
                <div className="gaps">
                  {weak.map((r) => (
                    <Link key={r.gp.topicId} to={`/t/${r.gp.topicId}`} className="chip">
                      {subject.topics.find((t) => t.id === r.gp.topicId)?.title}
                    </Link>
                  ))}
                </div>
                <p className="muted small">Кнопка внизу додасть їх у «Повторення».</p>
              </div>
            ) : (
              <p>Прогалин у цих темах не видно. Можна рухатись далі.</p>
            )
          }}
          onFinish={(res) => progressActions.flag(res.filter((r) => !r.correct).map((r) => r.gp.topicId))}
          onExit={() => setItems(null)}
        />
      </div>
    )
  }

  const allGrades = subject.grades
  return (
    <div className="page">
      <header className="page-head">
        <h1>Діагностика прогалин</h1>
        <p className="lead">
          По одній задачі з кожної (випадкової) теми обраних класів — без підказок. Результат покаже, що саме варто повторити, а слабкі теми потраплять у «Повторення».
        </p>
      </header>
      <div className="form">
        <label>
          Предмет
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Класи</legend>
          {allGrades.map((g) => (
            <label key={g} className="check-inline">
              <input type="checkbox" checked={grades.includes(g)} onChange={() => setGrades((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))} />
              {GRADE_LABEL(g)}
            </label>
          ))}
        </fieldset>
        <label>
          Кількість задач
          <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
            <option value={8}>8 (швидко)</option>
            <option value={12}>12</option>
            <option value={20}>20</option>
            <option value={999}>Усі теми (по одній задачі)</option>
          </select>
        </label>
        <p className="muted small">Доступно тем із матеріалами: {pool.length}.</p>
        <button className="btn primary" disabled={pool.length === 0} onClick={start}>
          Почати діагностику
        </button>
      </div>
    </div>
  )
}
