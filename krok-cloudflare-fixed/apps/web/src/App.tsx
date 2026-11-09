import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { dueTopicIds } from '@krok/core'
import { applyTheme, getTheme, setTheme, useProgress } from './store'
import { Home } from './pages/Home'
import { SubjectPage } from './pages/SubjectPage'
import { TopicPage } from './pages/TopicPage'
import { ReviewPage } from './pages/ReviewPage'
import { DiagnosticPage } from './pages/DiagnosticPage'
import { ReferencePage } from './pages/ReferencePage'
import { MePage } from './pages/MePage'

applyTheme()

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Крок — на головну">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--ink)" />
        <path d="M6 24h7v-6h6v-6h7" fill="none" stroke="#ffe66b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Крок</span>
    </Link>
  )
}

function ThemeToggle() {
  const [t, setT] = useState(getTheme())
  const next = t === 'auto' ? 'dark' : t === 'dark' ? 'light' : 'auto'
  return (
    <button
      className="icon-btn"
      onClick={() => {
        setTheme(next)
        setT(next)
      }}
      title={`Тема: ${t === 'auto' ? 'авто' : t === 'dark' ? 'темна' : 'світла'}. Натисни, щоб змінити.`}
      aria-label="Змінити тему оформлення"
    >
      {t === 'dark' ? '☾' : t === 'light' ? '☀' : '◐'}
    </button>
  )
}

export function App() {
  const progress = useProgress()
  const due = dueTopicIds(progress).length
  const loc = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [loc.pathname])
  return (
    <>
      <a href="#main" className="skip">
        До змісту
      </a>
      <header className="topbar">
        <div className="topbar-in">
          <Logo />
          <nav className="nav" aria-label="Основна навігація">
            <NavLink to="/" end>
              Головна
            </NavLink>
            <NavLink to="/s/algebra">Алгебра</NavLink>
            <NavLink to="/s/geometry">Геометрія</NavLink>
            <NavLink to="/review">
              Повторення{due > 0 && <span className="badge">{due}</span>}
            </NavLink>
            <NavLink to="/ref">Довідник</NavLink>
            <NavLink to="/me">Прогрес</NavLink>
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s/:id" element={<SubjectPage />} />
          <Route path="/t/:id" element={<TopicPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/diagnostic" element={<DiagnosticPage />} />
          <Route path="/ref" element={<ReferencePage />} />
          <Route path="/me" element={<MePage />} />
          <Route
            path="*"
            element={
              <div className="page">
                <h1>Сторінку не знайдено</h1>
                <p>
                  Перевір адресу або <Link to="/">повернись на головну</Link>.
                </p>
              </div>
            }
          />
        </Routes>
      </main>
    </>
  )
}
