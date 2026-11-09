import { useState } from 'react'
import { Link } from 'react-router-dom'
import { buildReview, dueTopicIds, isReady } from '@krok/core'
import type { GeneratedProblem } from '@krok/core'
import { getTopic } from '@krok/content'
import { useProgress, progressActions } from '../store'
import { MasteryBar, relativeDay } from '../components/ui'
import { Session } from '../components/Session'

export function ReviewPage() {
  const progress = useProgress()
  const [items, setItems] = useState<GeneratedProblem[] | null>(null)
  const due = dueTopicIds(progress)
  const flagged = progress.flagged.filter((id) => !due.includes(id))
  const upcoming = Object.entries(progress.topics)
    .filter(([id, p]) => p.due && !due.includes(id))
    .sort((a, b) => new Date(a[1].due!).getTime() - new Date(b[1].due!).getTime())
    .slice(0, 6)

  const start = (ids: string[]) => {
    const list = ids.flatMap((id) => {
      const t = getTopic(id)
      return t && isReady(t) ? buildReview(t, progress, 3) : []
    })
    if (list.length) setItems(list)
  }

  if (items) return (
    <div className="page">
      <Session title="Повторення" items={items} mode="learn" finishLabel="Готово" onExit={() => setItems(null)} />
    </div>
  )

  return (
    <div className="page">
      <header className="page-head">
        <h1>Повторення</h1>
        <p className="lead">Мозок забуває за кривою: чим вчасніше нагадати, тим довше тема тримається. Тому повторюємо інтервалами — завтра, за 3 дні, за тиждень, за місяць…</p>
      </header>

      <section>
        <h2>Час повторити {due.length > 0 && <span className="badge">{due.length}</span>}</h2>
        {due.length === 0 ? (
          <p className="muted">Зараз нічого не прострочено. Коли тема освоєна, вона з’явиться тут у потрібний день.</p>
        ) : (
          <>
            <ul className="topic-list">
              {due.map((id) => {
                const t = getTopic(id)
                if (!t) return null
                return (
                  <li key={id}>
                    <div className="topic-row">
                      <span className="topic-title">
                        <Link to={`/t/${id}`}>{t.title}</Link>
                      </span>
                      <span className="muted small">{relativeDay(progress.topics[id].due)}</span>
                      <MasteryBar progress={progress.topics[id]} />
                      <button className="btn small" onClick={() => start([id])}>
                        Повторити
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="actions">
              <button className="btn primary" onClick={() => start(due.slice(0, 6))}>
                Повторити все ({Math.min(due.length, 6) * 3} задач)
              </button>
            </div>
          </>
        )}
      </section>

      {flagged.length > 0 && (
        <section>
          <h2>Позначені тобою або діагностикою</h2>
          <ul className="topic-list">
            {flagged.map((id) => {
              const t = getTopic(id)
              if (!t) return null
              return (
                <li key={id}>
                  <div className="topic-row">
                    <span className="topic-title">
                      <Link to={`/t/${id}`}>{t.title}</Link>
                    </span>
                    <MasteryBar progress={progress.topics[id]} />
                    {isReady(t) && (
                      <button className="btn small" onClick={() => start([id])}>
                        Повторити
                      </button>
                    )}
                    <button className="btn small ghost" onClick={() => progressActions.unflag(id)}>
                      Прибрати
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2>Незабаром</h2>
          <ul className="topic-list">
            {upcoming.map(([id, p]) => (
              <li key={id}>
                <div className="topic-row">
                  <span className="topic-title">
                    <Link to={`/t/${id}`}>{getTopic(id)?.title ?? id}</Link>
                  </span>
                  <span className="muted small">{relativeDay(p.due)}</span>
                  <MasteryBar progress={p} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
