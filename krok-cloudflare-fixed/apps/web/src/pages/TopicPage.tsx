import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { buildTest, dependents, isReady, nextProblem, prerequisiteGaps } from '@krok/core'
import type { GeneratedProblem } from '@krok/core'
import { getSubject, getTopic, subjects, topicIndex } from '@krok/content'
import { getProgress, useProgress, progressActions } from '../store'
import { GRADE_LABEL, MasteryBar } from '../components/ui'
import { LessonView, ExamplesView, CheatSheet } from '../components/Lesson'
import { ProblemCard } from '../components/ProblemCard'
import { Session } from '../components/Session'

type Tab = 'lesson' | 'examples' | 'practice' | 'homework' | 'self' | 'control' | 'test' | 'cheat'
const TABS: [Tab, string][] = [
  ['lesson', 'Пояснення'], ['examples', 'Приклади 20–30'], ['practice', 'Практика'],
  ['homework', 'ДЗ · 30'], ['self', 'Самостійна · 50'], ['control', 'Контрольна · 100'],
  ['test', 'Тест'], ['cheat', 'Довідка'],
]

const ROUTE = [
  { key: 'lesson', title: 'Розібратися', meta: '2–3 аркуші пояснення', text: 'Інтуїція, означення, чому це працює, алгоритм і міні-перевірки.' },
  { key: 'examples', title: 'Побачити різні типи', meta: '20–30 прикладів', text: 'Від базових до складних, із повним покроковим розбором і типовими помилками.' },
  { key: 'practice', title: 'Спробувати самому', meta: 'безлімітна практика', text: 'Генератор змінює числа, підказки відкриваються поступово, помилки запам’ятовуються.' },
  { key: 'homework', title: 'Закріпити', meta: '30 завдань', text: 'Домашнє тренування з поясненням кожної помилки.' },
  { key: 'self', title: 'Перевірити себе', meta: '50 завдань', text: 'Самостійна без підказок, у кінці — відсоток і оцінка за 12-бальною шкалою.' },
  { key: 'control', title: 'Довести знання', meta: '100 завдань', text: 'Контрольна робота з трьома рівнями складності та планом повторення.' },
]

function StudyRoute({ active, onOpen }: { active: Tab; onOpen: (tab: Tab) => void }) {
  return <section className="study-route" aria-label="Маршрут підготовки">
    <div className="route-head"><div><span className="eyebrow">Не короткий тест, а повний цикл</span><h2>Маршрут підготовки</h2></div><span className="muted small">Рухайся поетапно — так знання закріплюються, а не зникають після вгадування.</span></div>
    <div className="route-grid">{ROUTE.map((item, i) => <button key={item.key} className={`route-card ${active === item.key ? 'active' : ''}`} onClick={() => onOpen(item.key as Tab)}><span className="route-number">{String(i + 1).padStart(2, '0')}</span><strong>{item.title}</strong><b>{item.meta}</b><span>{item.text}</span></button>)}</div>
  </section>
}

function Practice({ topicId }: { topicId: string }) {
  const topic = getTopic(topicId)!
  const progress = useProgress()
  const [recent, setRecent] = useState<string[]>([])
  const [gp, setGp] = useState<GeneratedProblem>(() => nextProblem(topic, progress))
  const [solved, setSolved] = useState(0)
  const [asked, setAsked] = useState(0)
  return <div className="practice"><div className="practice-head"><span className="muted small">Розв’язано правильно у цій сесії: {solved} із {asked}</span><MasteryBar progress={progress.topics[topicId]} label /></div><ProblemCard key={`${gp.templateId}-${gp.seed}`} gp={gp} mode="learn" onResult={(r) => { progressActions.attempt({ topicId, skill: gp.skill, correct: r.correct, hintsUsed: r.hintsUsed, solutionShown: r.solutionShown }); setAsked((a) => a + 1); if (r.correct && !r.solutionShown) setSolved((s) => s + 1) }} onNext={() => { const nr = [...recent, gp.templateId].slice(-4); setRecent(nr); setGp(nextProblem(topic, getProgress(), { recent: nr })) }} /></div>
}

function TestTab({ topicId }: { topicId: string }) {
  const topic = getTopic(topicId)!
  const [items, setItems] = useState<GeneratedProblem[] | null>(null)
  const count = Math.min(8, Math.max(5, topic.exercises.length + 2))
  const best = useProgress().topics[topicId]?.bestTest
  if (!items) return <div className="test-intro"><span className="eyebrow">Швидка діагностика</span><h2>Тест по темі</h2><p>{count} задач різної складності. Без підказок: відповідь приймається одразу, а розбір — у кінці. Найкращий результат зберігається{best !== undefined ? ` (зараз: ${Math.round(best * 100)}%)` : ''}.</p><p className="muted small">Хочеш реально прокачати тему — після тесту переходь до самостійної на 50 або контрольної на 100 завдань.</p><button className="btn primary" onClick={() => setItems(buildTest(topic, count))}>Почати тест</button></div>
  return <Session title="Тест" items={items} mode="quiz" isTest finishLabel="Закрити" onFinish={(res) => progressActions.testScore(topicId, res.filter((r) => r.correct).length / res.length)} onExit={() => setItems(null)} />
}

type AssessmentMode = 'homework' | 'self' | 'control'
function AssessmentTab({ topicId, mode }: { topicId: string; mode: AssessmentMode }) {
  const topic = getTopic(topicId)!
  const [items, setItems] = useState<GeneratedProblem[] | null>(null)
  const config = {
    homework: { title: 'Домашнє завдання', count: 30, eyebrow: 'Закріплення', intro: '30 задач: 12 базових, 12 стандартних і 6 складніших. Можна користуватися підказками — але вони впливають на оцінку майстерності.' },
    self: { title: 'Самостійна робота', count: 50, eyebrow: 'Самоперевірка', intro: '50 задач без підказок під час проходження. Після завершення відкриється повний розбір кожної помилки та оцінка за 12-бальною шкалою.' },
    control: { title: 'Контрольна робота', count: 100, eyebrow: 'Контроль знань', intro: '100 задач для серйозної перевірки: базовий, стандартний і високий рівні. Це не 3 приклади — це достатня вибірка, щоб побачити реальне розуміння теми.' },
  }[mode]
  if (!items) return <div className="assessment-intro"><span className="eyebrow">{config.eyebrow}</span><h2>{config.title}</h2><p className="lead">{config.intro}</p><div className="assessment-facts"><div><b>{config.count}</b><span>завдань</span></div><div><b>3</b><span>рівні складності</span></div><div><b>/12</b><span>підсумкова оцінка</span></div></div><div className="callout tip"><div className="callout-title">Що буде після завершення</div><p>Побачиш відсоток, оцінку, навички, де були помилки, і конкретну рекомендацію: що перечитати та скільки задач розв’язати повторно.</p></div><button className="btn primary" onClick={() => setItems(buildTest(topic, config.count))}>Почати · {config.title.toLocaleLowerCase('uk-UA')}</button></div>
  return <Session title={config.title} items={items} mode={mode === 'homework' ? 'learn' : 'quiz'} isTest={mode !== 'homework'} finishLabel="Повернутися до теми" onExit={() => setItems(null)} />
}

export function TopicPage() {
  const { id } = useParams()
  const topic = getTopic(id ?? '')
  const [params, setParams] = useSearchParams()
  const progress = useProgress()
  const requested = params.get('tab') as Tab | null
  const tab: Tab = requested && TABS.some(([key]) => key === requested) ? requested : 'lesson'
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true })
  const subject = topic ? getSubject(topic.subject) : undefined
  const gaps = useMemo(() => (topic ? prerequisiteGaps(topic.id, topicIndex, progress) : []), [topic, progress])
  const next = useMemo(() => (topic ? dependents(topic.id, subjects).slice(0, 4) : []), [topic])
  if (!topic || !subject) return <div className="page"><h1>Тему не знайдено</h1><Link to="/">На головну</Link></div>
  const p = progress.topics[topic.id]
  const ready = isReady(topic)
  const direct = topic.prereqs.map((x) => topicIndex.get(x)).filter(Boolean)
  return <div className="page topic" style={{ ['--accent' as string]: subject.color }}>
    <nav className="crumbs" aria-label="Навігація"><Link to={`/s/${subject.id}`}>{subject.title}</Link> <span>›</span> <span>{GRADE_LABEL(topic.grade)}</span> <span>›</span> <span>{subject.chapters.find((c) => c.id === topic.chapter)?.title}</span></nav>
    <header className="topic-head"><h1>{topic.title}</h1><p className="lead">{topic.summary}</p><div className="topic-head-meta"><MasteryBar progress={p} label /><span className="muted small">{topic.estMinutes} хв на розбір</span>{p?.attempts ? <span className="muted small">Задач: {p.attempts}, правильно без розв’язання: {p.correct}</span> : null}{progress.flagged.includes(topic.id) ? <button className="btn small ghost" onClick={() => progressActions.unflag(topic.id)}>Прибрати з «повторити»</button> : <button className="btn small ghost" onClick={() => progressActions.flag([topic.id])}>Хочу повторити</button>}</div></header>
    {gaps.length > 0 && <aside className="callout warning gap-box"><div className="callout-title">Спершу варто повторити</div><p>Ця тема спирається на те, що ще не закріплено:</p><div className="gaps">{gaps.map((g) => <Link key={g.id} to={`/t/${g.id}`} className="chip">{g.title} <span className="muted small">({GRADE_LABEL(g.grade)})</span></Link>)}</div></aside>}
    {!ready ? <div className="callout tip"><div className="callout-title">Матеріали цієї теми ще в розробці</div><p>Тут буде повне пояснення, 20–30 розібраних прикладів, тренажер і контрольний банк.</p>{direct.length > 0 && <p>Тим часом можна повторити передумови: {direct.map((d) => <Link key={d!.id} to={`/t/${d!.id}`} className="chip">{d!.title}</Link>)}</p>}</div> : <><StudyRoute active={tab} onOpen={setTab} /><div className="tabs sticky" role="tablist" aria-label="Розділи теми">{TABS.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{label}</button>)}</div><div className="tab-body">
      {tab === 'lesson' && <><div className="notebook"><LessonView topic={topic} /></div><div className="actions end"><button className="btn primary" onClick={() => { progressActions.lessonRead(topic.id); setTab('examples') }}>Зрозуміло — до прикладів</button></div></>}
      {tab === 'examples' && <><ExamplesView topic={topic} /><div className="actions end"><button className="btn primary" onClick={() => setTab('practice')}>До практики</button></div></>}
      {tab === 'practice' && <Practice topicId={topic.id} />}
      {tab === 'homework' && <AssessmentTab topicId={topic.id} mode="homework" />}
      {tab === 'self' && <AssessmentTab topicId={topic.id} mode="self" />}
      {tab === 'control' && <AssessmentTab topicId={topic.id} mode="control" />}
      {tab === 'test' && <TestTab topicId={topic.id} />}
      {tab === 'cheat' && <CheatSheet topic={topic} />}
    </div></>}
    {next.length > 0 && <section className="after"><h2>Що відкривається далі</h2><div className="gaps">{next.map((n) => <Link key={n.id} to={`/t/${n.id}`} className="chip">{n.title} <span className="muted small">({GRADE_LABEL(n.grade)})</span></Link>)}</div></section>}
  </div>
}
