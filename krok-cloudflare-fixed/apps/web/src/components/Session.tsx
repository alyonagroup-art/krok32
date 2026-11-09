import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { GeneratedProblem } from '@krok/core'
import { answerToText } from '@krok/core'
import { getTopic } from '@krok/content'
import { Md, Tex } from '../md'
import { ProblemCard, type CardResult } from './ProblemCard'
import { progressActions } from '../store'

export interface SessionResult extends CardResult { gp: GeneratedProblem }
interface Props { title: string; items: GeneratedProblem[]; mode: 'learn' | 'quiz'; isTest?: boolean; onFinish?: (results: SessionResult[]) => void; summaryExtra?: (results: SessionResult[]) => React.ReactNode; finishLabel?: string; onExit?: () => void }

export function Session({ title, items, mode, isTest, onFinish, summaryExtra, finishLabel = 'Завершити', onExit }: Props) {
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState<SessionResult[]>([])
  const [done, setDone] = useState(false)
  const gp = items[idx]
  const record = (r: CardResult) => { progressActions.attempt({ topicId: gp.topicId, skill: gp.skill, correct: r.correct, hintsUsed: r.hintsUsed, solutionShown: r.solutionShown, isTest }); setResults((prev) => [...prev, { ...r, gp }]) }
  const next = () => idx + 1 >= items.length ? setDone(true) : setIdx(idx + 1)
  if (done) {
    const finalResults = results
    const good = finalResults.filter((r) => r.correct && !r.solutionShown).length
    const percent = items.length ? Math.round((good / items.length) * 100) : 0
    const grade12 = Math.max(1, Math.min(12, Math.round((good / items.length) * 12)))
    const weak = Object.entries(finalResults.reduce<Record<string, number>>((acc, r) => { if (!(r.correct && !r.solutionShown)) acc[r.gp.skill] = (acc[r.gp.skill] ?? 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return <div className="session-summary"><span className="eyebrow">Розбір завершено</span><h2>{title}: результат</h2><p className="big-score">{good} з {items.length}</p><div className="stats"><div className="stat"><b>{percent}%</b><span>правильних відповідей</span></div><div className="stat"><b>{grade12}/12</b><span>орієнтовна оцінка</span></div><div className="stat"><b>{items.length - good}</b><span>потрібно розібрати</span></div></div><div className="callout tip"><div className="callout-title">Що робити далі</div><p>{good === items.length ? 'Тема закріплена. Переходь до наступної або повтори через кілька днів.' : 'Не просто дивись правильну відповідь: відкрий помилки нижче, перечитай відповідний блок пояснення і розв’яжи 5–10 задач цього типу в практиці.'}</p>{weak.length > 0 && <><strong>Слабкі навички:</strong><ul className="weak-list">{weak.map(([skill, count]) => <li key={skill}>{skill} — {count} помилок</li>)}</ul></>}</div>{summaryExtra?.(finalResults)}<ul className="review-list">{finalResults.map((r, i) => { const t = getTopic(r.gp.topicId); return <li key={i} className={r.correct && !r.solutionShown ? 'ok' : 'bad'}><details><summary><span className="mark">{r.correct && !r.solutionShown ? '✓' : '✗'}</span><span className="sum-text"><Md text={r.gp.problem.prompt} inline /></span></summary><div className="review-body">{t && <p className="muted small">Тема: <Link to={`/t/${t.id}`}>{t.title}</Link></p>}{r.answer !== undefined && r.answer !== '' && !(r.correct && !r.solutionShown) && <p className="small">Твоя відповідь: <code>{r.answer}</code></p>}<p className="small">Правильно: <strong>{r.gp.problem.answerTex ? <Tex tex={r.gp.problem.answerTex} /> : answerToText(r.gp.problem.answer)}</strong></p><ol>{r.gp.problem.solution.map((s, k) => <li key={k}><Md text={s} /></li>)}</ol></div></details></li> })}</ul><div className="actions"><button className="btn primary" onClick={() => { onFinish?.(finalResults); onExit?.() }}>{finishLabel}</button></div></div>
  }
  return <section className="session"><div className="session-head"><h2>{title}</h2><div className="progress-track" aria-label={`Задача ${idx + 1} з ${items.length}`}><div className="progress-fill" style={{ width: `${(idx / items.length) * 100}%` }} /></div><span className="muted small">{idx + 1} / {items.length}</span></div>{mode === 'learn' && getTopic(gp.topicId) && <p className="muted small">Тема: <Link to={`/t/${gp.topicId}`}>{getTopic(gp.topicId)!.title}</Link></p>}<ProblemCard key={`${gp.topicId}-${gp.templateId}-${gp.seed}-${idx}`} gp={gp} mode={mode} onResult={record} onNext={next} nextLabel={idx + 1 >= items.length ? 'До результатів' : 'Далі'} /></section>
}
