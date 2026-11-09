import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { dayKey, dueTopicIds, currentStreak, effectiveMastery, isReady, recommend, topicStatus } from '@krok/core'
import { subjects, topicIndex } from '@krok/content'
import { useProgress } from '../store'
import { GRADE_LABEL, MasteryBar, relativeDay } from '../components/ui'

const REASON: Record<string, string> = { due: 'Час повторити', continue: 'Продовжити', flagged: 'Ти позначив(ла)', next: 'Нова тема' }

export function Home() {
  const progress = useProgress()
  const grade = progress.profile.grade
  const recs = useMemo(() => subjects.flatMap((s) => recommend(s, topicIndex, progress, new Date(), 3).map((r) => ({ ...r, subject: s }))).slice(0, 6), [progress])
  const due = dueTopicIds(progress)
  const streak = currentStreak(progress)
  const today = progress.activity.find((d) => d.date === dayKey(new Date()))
  const name = progress.profile.name.trim()

  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-note">{name ? `Привіт, ${name}!` : 'Привіт!'}</div>
        <h1>Вчимося крок за кроком</h1>
        <p className="lead">
          Алгебра і геометрія 7–10 класів: пояснення «для людей», розібрані приклади, задачі з підказками, тести та повторення, що вчасно нагадує про забуте. Зараз у профілі — {grade} клас.
        </p>
        <div className="hero-stats">
          <div>
            <b>{streak}</b>
            <span>{streak === 1 ? 'день поспіль' : 'днів поспіль'}</span>
          </div>
          <div>
            <b>{today?.answered ?? 0}</b>
            <span>задач сьогодні</span>
          </div>
          <div>
            <b>{Object.values(progress.topics).filter((t) => topicStatus(t) === 'mastered').length}</b>
            <span>тем освоєно</span>
          </div>
        </div>
      </section>

      {due.length > 0 && (
        <section className="banner">
          <div>
            <strong>
              Час повторити: {due.length} {due.length === 1 ? 'тема' : 'тем'}
            </strong>
            <span className="muted"> — коротко (3 задачі на тему), поки не забулось.</span>
          </div>
          <Link to="/review" className="btn primary">
            Повторити
          </Link>
        </section>
      )}

      <section>
        <h2>Що вчити далі</h2>
        {recs.length === 0 ? (
          <p className="muted">Обери предмет нижче й почни з будь-якої теми.</p>
        ) : (
          <div className="card-grid">
            {recs.map(({ topic, reason, subject }) => (
              <Link key={topic.id} to={`/t/${topic.id}`} className="card topic-card" style={{ ['--accent' as string]: subject.color }}>
                <div className="card-meta">
                  <span className="chip accent">{subject.title}</span>
                  <span className="muted small">{GRADE_LABEL(topic.grade)}</span>
                </div>
                <div className="card-title">{topic.title}</div>
                <div className="card-foot">
                  <span className={`reason ${reason}`}>{REASON[reason]}</span>
                  <MasteryBar progress={progress.topics[topic.id]} />
                </div>
                {reason === 'due' && <div className="muted small">{relativeDay(progress.topics[topic.id]?.due)}</div>}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Предмети</h2>
        <div className="card-grid subjects">
          {subjects.map((s) => {
            const ready = s.topics.filter(isReady)
            const mastered = ready.filter((t) => effectiveMastery(progress.topics[t.id]) >= 0.8).length
            return (
              <Link key={s.id} to={`/s/${s.id}`} className="card subject-card" style={{ ['--accent' as string]: s.color }}>
                <div className="subject-icon" aria-hidden="true">
                  {s.icon}
                </div>
                <div className="card-title">{s.title}</div>
                <p className="muted">{s.description}</p>
                <div className="muted small">
                  Готово тем: {ready.length} із {s.topics.length} · освоєно {mastered}
                </div>
              </Link>
            )
          })}
          <div className="card subject-card soon">
            <div className="subject-icon" aria-hidden="true">
              +
            </div>
            <div className="card-title">Інші предмети</div>
            <p className="muted">Платформа вміє більше за математику: фізику, хімію, мови можна додати без переписування коду.</p>
          </div>
        </div>
      </section>

      <section className="banner soft">
        <div>
          <strong>Не знаєш, з чого почати?</strong>
          <span className="muted"> Коротка діагностика покаже прогалини у 7–9 класах — і ми складемо план.</span>
        </div>
        <Link to="/diagnostic" className="btn">
          Пройти діагностику
        </Link>
      </section>
    </div>
  )
}
