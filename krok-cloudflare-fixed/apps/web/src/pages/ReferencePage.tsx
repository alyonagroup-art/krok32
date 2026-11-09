import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { isReady } from '@krok/core'
import { subjects } from '@krok/content'
import { Md, Tex } from '../md'
import { GRADE_LABEL } from '../components/ui'

export function ReferencePage() {
  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('all')
  const [grade, setGrade] = useState(0)
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return subjects
      .filter((s) => subject === 'all' || s.id === subject)
      .flatMap((s) => s.topics.filter((t) => isReady(t) && (grade === 0 || t.grade === grade) && t.formulas?.length).map((t) => ({ s, t })))
      .map(({ s, t }) => ({ s, t, formulas: t.formulas!.filter((f) => !ql || f.title.toLowerCase().includes(ql) || t.title.toLowerCase().includes(ql) || f.tex.toLowerCase().includes(ql)) }))
      .filter((r) => r.formulas.length)
  }, [q, subject, grade])

  return (
    <div className="page">
      <header className="page-head">
        <h1>Довідник формул</h1>
        <p className="lead">Усі формули з тем в одному місці. Натисни на назву теми, щоб відкрити пояснення.</p>
      </header>
      <div className="filters">
        <input className="text-input" type="search" placeholder="Пошук: «дискримінант», «синус»…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Пошук формули" />
        <select value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Предмет">
          <option value="all">Усі предмети</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} aria-label="Клас">
          <option value={0}>Усі класи</option>
          {[6, 7, 8, 9, 10].map((g) => (
            <option key={g} value={g}>
              {GRADE_LABEL(g)}
            </option>
          ))}
        </select>
      </div>
      {rows.length === 0 && <p className="muted">Нічого не знайдено.</p>}
      {rows.map(({ s, t, formulas }) => (
        <section key={t.id} className="ref-topic" style={{ ['--accent' as string]: s.color }}>
          <h2>
            <Link to={`/t/${t.id}`}>{t.title}</Link>
            <span className="muted small"> · {s.title}, {GRADE_LABEL(t.grade)}</span>
          </h2>
          <div className="formula-grid">
            {formulas.map((f, i) => (
              <div key={i} className="formula">
                <div className="formula-title">
                  <Md text={f.title} inline />
                </div>
                <div className="formula-tex">
                  <Tex tex={f.tex} display />
                </div>
                {f.note && <Md text={f.note} className="muted small" />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
