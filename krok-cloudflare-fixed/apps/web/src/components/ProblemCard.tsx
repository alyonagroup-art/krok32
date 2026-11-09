import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AnswerSpec, GeneratedProblem, Step } from '@krok/core'
import { answerToText, checkAnswer, effectiveMastery, isReady } from '@krok/core'
import { topicIndex } from '@krok/content'
import { Md, Tex } from '../md'
import { FigureView } from './FigureView'
import { useProgress } from '../store'

export interface CardResult {
  correct: boolean
  hintsUsed: number
  solutionShown: boolean
  answer?: string
  skipped?: boolean
}

interface Props {
  gp: GeneratedProblem
  mode: 'learn' | 'quiz'
  onResult: (r: CardResult) => void
  onNext: () => void
  nextLabel?: string
  /** показувати прогалини у передумовах після помилок */
  showGaps?: boolean
}

const KEYPADS: Record<string, string[]> = {
  number: ['√', '^', 'π', '/', '(', ')', '−'],
  expression: ['√', '^', '²', 'π', '/', '(', ')', '−', '×'],
  equation: ['=', '^', '²', '/', '(', ')', '−', '√'],
  numberSet: [';', '√', '/', '−', 'немає'],
  tuple: [';', '√', '/', '−', '(', ')'],
  interval: ['∞', '∪', '≤', '≥', '(', ')', '[', ']', ';', '−'],
  text: [],
  choice: [],
}

function AnswerInput({
  spec,
  value,
  onChange,
  onSubmit,
  disabled,
  hint,
  autoFocus,
}: {
  spec: AnswerSpec
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
  hint?: string
  autoFocus?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  if (spec.kind === 'choice') {
    const picked = new Set(value.split(',').filter(Boolean).map(Number))
    const toggle = (i: number) => {
      if (disabled) return
      const next = new Set(spec.multiple ? picked : [])
      if (picked.has(i) && spec.multiple) next.delete(i)
      else next.add(i)
      onChange([...next].sort((a, b) => a - b).join(','))
    }
    return (
      <div className="choices" role={spec.multiple ? 'group' : 'radiogroup'}>
        {spec.options.map((o, i) => (
          <button key={i} type="button" className={`choice ${picked.has(i) ? 'on' : ''}`} onClick={() => toggle(i)} disabled={disabled} role={spec.multiple ? 'checkbox' : 'radio'} aria-checked={picked.has(i)}>
            <span className="choice-mark">{spec.multiple ? (picked.has(i) ? '☑' : '☐') : picked.has(i) ? '●' : '○'}</span>
            <Md text={o} inline />
          </button>
        ))}
        {spec.multiple && <p className="muted small">Можливо кілька правильних варіантів.</p>}
      </div>
    )
  }
  const keys = KEYPADS[spec.kind] ?? []
  const insert = (k: string) => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = value.slice(0, start) + k + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + k.length, start + k.length)
    })
  }
  return (
    <div className="answer-input">
      <div className="input-row">
        <input
          ref={ref}
          className="text-input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
          }}
          placeholder="Твоя відповідь"
          aria-label="Відповідь"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
        />
      </div>
      {keys.length > 0 && !disabled && (
        <div className="keypad" aria-label="Спеціальні символи">
          {keys.map((k) => (
            <button key={k} type="button" className="key" onClick={() => insert(k)} tabIndex={-1}>
              {k}
            </button>
          ))}
        </div>
      )}
      {hint && <p className="muted small input-hint">{hint}</p>}
    </div>
  )
}

function CorrectAnswer({ gp }: { gp: GeneratedProblem }) {
  const p = gp.problem
  return (
    <p className="correct-answer">
      Відповідь: <strong>{p.answerTex ? <Tex tex={p.answerTex} /> : p.answer.kind === 'choice' ? <Md text={answerToText(p.answer)} inline /> : answerToText(p.answer)}</strong>
    </p>
  )
}

function Solution({ gp }: { gp: GeneratedProblem }) {
  return (
    <div className="solution">
      <h4>Розв’язання</h4>
      <ol>
        {gp.problem.solution.map((s, i) => (
          <li key={i}>
            <Md text={s} />
          </li>
        ))}
      </ol>
      <CorrectAnswer gp={gp} />
    </div>
  )
}

function StepsRunner({ steps, onFinish }: { steps: Step[]; onFinish: () => void }) {
  const [i, setI] = useState(0)
  const [val, setVal] = useState('')
  const [fb, setFb] = useState<string | null>(null)
  const [hint, setHint] = useState(false)
  const [done, setDone] = useState<number[]>([])
  const step = steps[i]
  const submit = () => {
    const r = checkAnswer(step.answer, val)
    if (r.correct) {
      setDone((d) => [...d, i])
      setFb(null)
      setHint(false)
      setVal('')
      if (i + 1 >= steps.length) onFinish()
      else setI(i + 1)
    } else setFb(r.feedback ?? 'Поки не так. Перечитай крок і спробуй ще — або візьми підказку.')
  }
  return (
    <div className="steps">
      <h4>Розбиваємо на кроки</h4>
      <ol className="steps-done">
        {done.map((d) => (
          <li key={d}>
            <div className="step-q">
              <Md text={steps[d].prompt} />
            </div>
            <div className="step-ok">
              ✓ <Md text={steps[d].explanation} inline />
            </div>
          </li>
        ))}
      </ol>
      {done.length < steps.length && (
        <div className="step-current">
          <div className="step-counter">
            Крок {i + 1} з {steps.length}
          </div>
          <Md text={step.prompt} />
          <AnswerInput spec={step.answer} value={val} onChange={setVal} onSubmit={submit} autoFocus />
          {fb && <p className="feedback bad">{fb}</p>}
          {hint && step.hint && (
            <p className="note">
              <Md text={step.hint} inline />
            </p>
          )}
          <div className="actions">
            <button className="btn primary" onClick={submit}>
              Перевірити крок
            </button>
            {step.hint && !hint && (
              <button className="btn ghost" onClick={() => setHint(true)}>
                Підказка до кроку
              </button>
            )}
            <button
              className="btn ghost"
              onClick={() => {
                setDone((d) => [...d, i])
                setFb(null)
                setHint(false)
                setVal('')
                if (i + 1 >= steps.length) onFinish()
                else setI(i + 1)
              }}
            >
              Показати крок
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ProblemCard({ gp, mode, onResult, onNext, nextLabel = 'Наступна задача', showGaps = true }: Props) {
  const p = gp.problem
  const [value, setValue] = useState('')
  const [hints, setHints] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [phase, setPhase] = useState<'answer' | 'correct' | 'revealed'>('answer')
  const [stepsOpen, setStepsOpen] = useState(false)
  const reported = useRef(false)
  const progress = useProgress()

  const report = (r: CardResult) => {
    if (reported.current) return
    reported.current = true
    onResult(r)
  }

  const submit = () => {
    if (phase !== 'answer') return
    const r = checkAnswer(p.answer, value)
    if (mode === 'quiz') {
      if (r.unreadable && !value.trim()) {
        setFeedback('Спочатку введи відповідь або натисни «Не знаю».')
        return
      }
      report({ correct: r.correct, hintsUsed: 0, solutionShown: false, answer: value })
      onNext()
      return
    }
    if (r.correct) {
      setPhase('correct')
      setFeedback(null)
      report({ correct: true, hintsUsed: hints + (wrong > 0 ? 1 : 0), solutionShown: false, answer: value })
    } else {
      if (!r.unreadable) setWrong((w) => w + 1)
      setFeedback(r.feedback ?? (wrong >= 1 ? 'Ще не так. Візьми підказку — вона не знижує оцінку так сильно, як показане розв’язання.' : 'Поки не так. Перевір знаки й обчислення та спробуй ще раз.'))
    }
  }

  const reveal = () => {
    setPhase('revealed')
    setStepsOpen(false)
    report({ correct: false, hintsUsed: hints, solutionShown: true, answer: value })
  }

  const gaps = useMemo(() => {
    if (!showGaps || mode !== 'learn' || (phase === 'answer' && wrong < 2) || phase === 'correct') return []
    const t = topicIndex.get(gp.topicId)
    if (!t) return []
    return t.prereqs
      .map((id) => topicIndex.get(id))
      .filter((x): x is NonNullable<typeof x> => !!x && isReady(x) && effectiveMastery(progress.topics[x.id]) < 0.65)
      .slice(0, 3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wrong, gp.topicId, mode])

  return (
    <article className="problem">
      <div className="problem-head">
        <span className={`diff d${gp.difficulty}`} title="Складність">
          {'●'.repeat(gp.difficulty)}
          {'○'.repeat(3 - gp.difficulty)}
        </span>
      </div>
      <Md text={p.prompt} className="problem-text" />
      {p.figure && <FigureView figure={p.figure} />}

      {phase === 'answer' && !stepsOpen && (
        <>
          <AnswerInput spec={p.answer} value={value} onChange={setValue} onSubmit={submit} hint={p.inputHint} autoFocus />
          {feedback && <p className="feedback bad" role="alert">{feedback}</p>}
        </>
      )}

      {mode === 'learn' && hints > 0 && phase !== 'revealed' && (
        <div className="notes" aria-live="polite">
          {p.hints.slice(0, hints).map((h, i) => (
            <p className="note" key={i}>
              <span className="note-n">{i + 1}</span>
              <Md text={h} inline />
            </p>
          ))}
        </div>
      )}

      {phase === 'answer' && stepsOpen && p.steps && <StepsRunner steps={p.steps} onFinish={() => { setPhase('correct'); report({ correct: true, hintsUsed: 3, solutionShown: false, answer: value }) }} />}

      {phase === 'answer' && (
        <div className="actions">
          {!stepsOpen && (
            <button className="btn primary" onClick={submit}>
              {mode === 'quiz' ? 'Відповісти' : 'Перевірити'}
            </button>
          )}
          {mode === 'learn' && !stepsOpen && hints < p.hints.length && (
            <button className="btn ghost" onClick={() => setHints((h) => h + 1)}>
              Підказка ({hints}/{p.hints.length})
            </button>
          )}
          {mode === 'learn' && p.steps && !stepsOpen && (
            <button className="btn ghost" onClick={() => setStepsOpen(true)}>
              Розбити на кроки
            </button>
          )}
          {mode === 'learn' && (
            <button className="btn quiet" onClick={reveal}>
              Показати розв’язання
            </button>
          )}
          {mode === 'quiz' && (
            <button
              className="btn quiet"
              onClick={() => {
                report({ correct: false, hintsUsed: 0, solutionShown: false, skipped: true, answer: '' })
                onNext()
              }}
            >
              Не знаю
            </button>
          )}
        </div>
      )}

      {phase === 'correct' && (
        <div className="result good" role="status">
          <p className="feedback good">
            <strong>Правильно!</strong> {hints + wrong === 0 ? 'Без підказок — чудово.' : 'Так тримати.'}
          </p>
          <Solution gp={gp} />
          <div className="actions">
            <button className="btn primary" onClick={onNext} autoFocus>
              {nextLabel}
            </button>
          </div>
        </div>
      )}

      {phase === 'revealed' && (
        <div className="result" role="status">
          <Solution gp={gp} />
          <p className="muted small">Ця задача не зарахована як самостійна. Наступна буде схожою — спробуй вже сам(а).</p>
          {gaps.length > 0 && (
            <div className="gaps">
              Схоже, варто повторити:
              {gaps.map((g) => (
                <Link key={g.id} to={`/t/${g.id}`} className="chip">
                  {g.title}
                </Link>
              ))}
            </div>
          )}
          <div className="actions">
            <button className="btn primary" onClick={onNext}>
              {nextLabel}
            </button>
          </div>
        </div>
      )}

      {phase === 'answer' && gaps.length > 0 && (
        <div className="gaps">
          Не виходить? Можливо, варто повторити:
          {gaps.map((g) => (
            <Link key={g.id} to={`/t/${g.id}`} className="chip">
              {g.title}
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}
