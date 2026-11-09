import { useSyncExternalStore } from 'react'
import { applyAttempt, emptyProgress, flagTopics, isProgressState, markLessonRead, mergeProgress, recordTestScore, unflagTopic } from '@krok/core'
import type { AttemptResult, ProgressState } from '@krok/core'

const KEY = 'krok:progress:v1'

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isProgressState(parsed)) return parsed
    }
  } catch {
    /* сховище недоступне — працюємо в пам'яті */
  }
  return emptyProgress(10)
}

let state: ProgressState = load()
const listeners = new Set<() => void>()

function set(next: ProgressState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export const getProgress = (): ProgressState => state

export function useProgress(): ProgressState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

export const progressActions = {
  attempt: (r: AttemptResult) => set(applyAttempt(state, r)),
  lessonRead: (topicId: string) => set(markLessonRead(state, topicId)),
  testScore: (topicId: string, fraction: number) => set(recordTestScore(state, topicId, fraction)),
  flag: (ids: string[]) => set(flagTopics(state, ids)),
  unflag: (id: string) => set(unflagTopic(state, id)),
  setProfile: (p: Partial<ProgressState['profile']>) => set({ ...state, profile: { ...state.profile, ...p } }),
  exportJson: () => JSON.stringify(state, null, 2),
  importJson: (text: string): boolean => {
    try {
      const parsed = JSON.parse(text)
      if (!isProgressState(parsed)) return false
      set(mergeProgress(state, parsed))
      return true
    } catch {
      return false
    }
  },
  reset: () => set(emptyProgress(state.profile.grade, state.profile.name)),
}

// ── тема (світла/темна) ──
const THEME_KEY = 'krok:theme'
export function getTheme(): 'light' | 'dark' | 'auto' {
  try {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'auto'
  } catch {
    return 'auto'
  }
}
export function setTheme(t: 'light' | 'dark' | 'auto') {
  try {
    if (t === 'auto') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, t)
  } catch {
    /* ignore */
  }
  applyTheme()
}
export function applyTheme() {
  const t = getTheme()
  if (t === 'auto') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', t)
}
