import { useState } from 'react'
import type { Block, Topic, WorkedExample } from '@krok/core'
import { Md, Tex } from '../md'
import { FigureView } from './FigureView'

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case 'text':
      return <Md text={b.md} />
    case 'intuition':
      return (
        <aside className="callout intuition">
          <div className="callout-title">Простими словами</div>
          <Md text={b.md} />
        </aside>
      )
    case 'definition':
      return (
        <aside className="callout definition">
          <div className="callout-title">Означення: {b.term}</div>
          <Md text={b.md} />
        </aside>
      )
    case 'rule':
      return (
        <aside className="callout rule">
          <div className="callout-title">{b.title ?? 'Правило'}</div>
          <Md text={b.md} />
        </aside>
      )
    case 'warning':
      return (
        <aside className="callout warning">
          <div className="callout-title">Обережно</div>
          <Md text={b.md} />
        </aside>
      )
    case 'tip':
      return (
        <aside className="callout tip">
          <div className="callout-title">Корисно знати</div>
          <Md text={b.md} />
        </aside>
      )
    case 'figure':
      return <FigureView figure={b.figure} />
    case 'algorithm':
      return <Algorithm title={b.title} steps={b.steps} />
    case 'check':
      return (
        <details className="check">
          <summary>
            <span className="check-label">Перевір себе</span> <Md text={b.question} inline />
          </summary>
          <div className="check-answer">
            <Md text={b.answer} />
            {b.explain && <Md text={b.explain} className="muted" />}
          </div>
        </details>
      )
  }
}

function Algorithm({ title, steps }: { title: string; steps: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  return (
    <aside className="callout algorithm">
      <div className="callout-title">{title}</div>
      <ol>
        {steps.map((s, i) => (
          <li key={i} className={checked.has(i) ? 'done' : ''}>
            <label>
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={() =>
                  setChecked((c) => {
                    const n = new Set(c)
                    if (n.has(i)) n.delete(i)
                    else n.add(i)
                    return n
                  })
                }
              />
              <span className="alg-text">
                <Md text={s} inline />
              </span>
            </label>
          </li>
        ))}
      </ol>
    </aside>
  )
}

export function LessonView({ topic }: { topic: Topic }) {
  return (
    <div className="lesson">
      {topic.lesson.map((sec, i) => (
        <section key={i} className="lesson-section">
          <h2>{sec.title}</h2>
          {sec.blocks.map((b, j) => (
            <BlockView key={j} b={b} />
          ))}
        </section>
      ))}
    </div>
  )
}

function ExampleView({ ex, index }: { ex: WorkedExample; index: number }) {
  const [shown, setShown] = useState(1)
  const total = ex.steps.length
  return (
    <article className="example">
      <h3>
        Приклад {index + 1}
        {ex.title ? `: ${ex.title}` : ''}
      </h3>
      <Md text={ex.problem} className="problem-text" />
      {ex.figure && <FigureView figure={ex.figure} />}
      <ol className="ex-steps">
        {ex.steps.slice(0, shown).map((s, i) => (
          <li key={i}>
            {s.think && (
              <p className="note">
                <Md text={s.think} inline />
              </p>
            )}
            <Md text={s.do} />
          </li>
        ))}
      </ol>
      {shown < total ? (
        <div className="actions">
          <button className="btn primary" onClick={() => setShown(shown + 1)}>
            Наступний крок ({shown}/{total})
          </button>
          <button className="btn quiet" onClick={() => setShown(total)}>
            Показати все
          </button>
        </div>
      ) : (
        <p className="ex-answer">
          <strong>Відповідь:</strong> <Md text={ex.answer} inline />
        </p>
      )}
    </article>
  )
}

export function ExamplesView({ topic }: { topic: Topic }) {
  return (
    <div className="examples">
      <p className="muted">Не поспішай: натискай «Наступний крок» лише тоді, коли сам(а) спробував(ла) здогадатись, що буде далі.</p>
      {topic.examples.map((ex, i) => (
        <ExampleView key={i} ex={ex} index={i} />
      ))}
    </div>
  )
}

export function CheatSheet({ topic }: { topic: Topic }) {
  return (
    <div className="cheat">
      {topic.formulas && topic.formulas.length > 0 && (
        <>
          <h2>Формули</h2>
          <div className="formula-grid">
            {topic.formulas.map((f, i) => (
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
        </>
      )}
      {topic.mistakes && topic.mistakes.length > 0 && (
        <>
          <h2>Типові помилки</h2>
          <ul className="mistakes">
            {topic.mistakes.map((m, i) => (
              <li key={i}>
                <div className="m-wrong">
                  <span>✗</span> <Md text={m.wrong} inline />
                </div>
                <div className="m-why muted">
                  <Md text={m.why} inline />
                </div>
                <div className="m-right">
                  <span>✓</span> <Md text={m.right} inline />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {!topic.formulas?.length && !topic.mistakes?.length && <p className="muted">Для цієї теми довідка ще порожня.</p>}
    </div>
  )
}
