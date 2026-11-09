import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { currentStreak, dayKey, isReady, topicStatus } from '@krok/core'
import { getTopic, subjects } from '@krok/content'
import { progressActions, useProgress } from '../store'
import { GRADE_LABEL } from '../components/ui'

export function MePage() {
  const progress = useProgress()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const totalAnswered = progress.activity.reduce((a, d) => a + d.answered, 0)
  const totalCorrect = progress.activity.reduce((a, d) => a + d.correct, 0)

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const key = dayKey(d)
    return { key, label: d.getDate(), n: progress.activity.find((a) => a.date === key)?.answered ?? 0 }
  })
  const maxN = Math.max(5, ...days.map((d) => d.n))

  const weak = Object.entries(progress.topics)
    .filter(([, p]) => p.weakSkills)
    .flatMap(([id, p]) => Object.entries(p.weakSkills!).map(([skill, n]) => ({ id, skill, n })))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8)

  const download = () => {
    const blob = new Blob([progressActions.exportJson()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `krok-progress-${dayKey(new Date())}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>Мій прогрес</h1>
      </header>

      <section className="stats">
        <div className="stat"><b>{currentStreak(progress)}</b><span>днів поспіль</span></div>
        <div className="stat"><b>{totalAnswered}</b><span>задач за весь час</span></div>
        <div className="stat"><b>{totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%</b><span>правильно, без розв’язання</span></div>
      </section>

      <section>
        <h2>Останні 14 днів</h2>
        <div className="bars" role="img" aria-label="Кількість задач за днями">
          {days.map((d) => (
            <div key={d.key} className="bar-col" title={`${d.key}: ${d.n}`}>
              <div className="bar" style={{ height: `${(d.n / maxN) * 100}%` }} />
              <span>{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Освоєння за класами</h2>
        {subjects.map((s) => (
          <div key={s.id} className="subj-progress" style={{ ['--accent' as string]: s.color }}>
            <h3>{s.title}</h3>
            {s.grades.map((g) => {
              const ts = s.topics.filter((t) => t.grade === g && isReady(t))
              if (!ts.length) return null
              const m = ts.filter((t) => topicStatus(progress.topics[t.id]) === 'mastered').length
              const f = ts.filter((t) => ['familiar', 'learning'].includes(topicStatus(progress.topics[t.id]))).length
              return (
                <div key={g} className="grade-row">
                  <span className="grade-name">{GRADE_LABEL(g)}</span>
                  <div className="stack-bar" title={`Освоєно ${m}, у процесі ${f}, усього ${ts.length}`}>
                    <div className="seg mastered" style={{ width: `${(m / ts.length) * 100}%` }} />
                    <div className="seg learning" style={{ width: `${(f / ts.length) * 100}%` }} />
                  </div>
                  <span className="muted small">{m}/{ts.length}</span>
                </div>
              )
            })}
          </div>
        ))}
      </section>

      {weak.length > 0 && (
        <section>
          <h2>Слабкі місця</h2>
          <p className="muted">Типи задач, де найчастіше бували помилки або підказки:</p>
          <ul className="weak-list">
            {weak.map((w) => (
              <li key={w.id + w.skill}>
                <Link to={`/t/${w.id}?tab=practice`}>{w.skill}</Link> <span className="muted small">— {getTopic(w.id)?.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Налаштування</h2>
        <div className="form">
          <label>
            Ім’я
            <input className="text-input" value={progress.profile.name} onChange={(e) => progressActions.setProfile({ name: e.target.value })} placeholder="Як до тебе звертатись?" />
          </label>
          <label>
            Мій клас
            <select value={progress.profile.grade} onChange={(e) => progressActions.setProfile({ grade: Number(e.target.value) })}>
              {[7, 8, 9, 10].map((g) => (
                <option key={g} value={g}>
                  {g} клас
                </option>
              ))}
            </select>
          </label>
        </div>
        <h3>Копія прогресу</h3>
        <p className="muted small">Прогрес зберігається в цьому браузері. Щоб перенести на інший пристрій — збережи файл і завантаж його там.</p>
        <div className="actions">
          <button className="btn" onClick={download}>Зберегти у файл</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Завантажити з файлу</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              setMsg(progressActions.importJson(await f.text()) ? 'Прогрес об’єднано.' : 'Не вдалося прочитати файл.')
              e.target.value = ''
            }}
          />
          <button
            className="btn quiet danger"
            onClick={() => {
              if (confirm('Скинути весь прогрес? Це не можна скасувати.')) progressActions.reset()
            }}
          >
            Скинути прогрес
          </button>
        </div>
        {msg && <p role="status">{msg}</p>}
      </section>
    </div>
  )
}

