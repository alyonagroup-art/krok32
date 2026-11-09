import type { AnswerSpec, CheckResult } from '../types'
import { closeTo, compileExpr, evalAt, evalNumber, expressionsEquivalent, normalizeMath, variablesOf } from './expr'
import { intervalsEqual, parseIntervals } from './intervals'

const EMPTY_SET_RE = /^(∅|немає|нема|коренів немає|розв.язків немає|немає розв.язків|немає коренів|порожня множина|-|—|нет|no)\.?$/i

const UNREADABLE: CheckResult = { correct: false, unreadable: true, feedback: 'Не вдалося розпізнати відповідь. Перевір запис (дроби — через /, корінь — √ або sqrt).' }

function stripVarPrefix(s: string): string {
  return s.trim().replace(/^[xyzабxх]\s*(?:_?\s*\d)?\s*=\s*/i, '').trim()
}

/** Розбиває «2; -3», «2, -3», «2 або -3» на частини-кандидати. Повертає декілька варіантів розбиття. */
function splitCandidates(input: string): string[][] {
  const s = input.trim().replace(/^\{|\}$/g, '').replace(/^\(|\)$/g, '')
  const out: string[][] = []
  if (s.includes(';')) out.push(s.split(';'))
  else {
    const byWord = s.split(/\s+(?:або|та|и|і|or|and)\s+/i)
    if (byWord.length > 1) out.push(byWord.flatMap((w) => w.split(/,\s+/)))
    else {
      if (/,\s/.test(s)) out.push(s.split(/,\s+/))
      // «2,3» без пробілу: або десяткове число, або два числа
      out.push([s])
      if (s.includes(',')) out.push(s.split(','))
    }
  }
  return out.map((parts) => parts.map(stripVarPrefix).filter((p) => p.length > 0))
}

function parseNumberList(parts: string[]): number[] | null {
  const nums: number[] = []
  for (const p of parts) {
    const v = evalNumber(p)
    if (v === null) return null
    nums.push(v)
  }
  return nums
}

function uniqueSorted(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.filter((v, i) => i === 0 || !closeTo(v, sorted[i - 1], 1e-9))
}

function setsEqual(a: number[], b: number[]): boolean {
  const x = uniqueSorted(a)
  const y = uniqueSorted(b)
  return x.length === y.length && x.every((v, i) => closeTo(v, y[i], 1e-6))
}

function checkNumber(spec: Extract<AnswerSpec, { kind: 'number' }>, input: string): CheckResult {
  const raw = input.trim().replace(/^[a-zа-я]\s*=\s*/i, '')
  const v = evalNumber(raw)
  if (v === null) return UNREADABLE
  const tol = spec.tolerance ?? 1e-6
  const ok = tol > 0 && tol < 1e-3 ? closeTo(v, spec.value, tol) : Math.abs(v - spec.value) <= tol
  if (ok) return { correct: true }
  // типова помилка: округлення до іншої кількості знаків
  return { correct: false }
}

function checkExpression(spec: Extract<AnswerSpec, { kind: 'expression' }>, input: string): CheckResult {
  const raw = input.trim().replace(/^(?:y|f|g|p|s)(?:\([a-zа-я]\))?\s*=\s*/i, '')
  if (!raw) return UNREADABLE
  if (raw.includes('=')) return { correct: false, unreadable: true, feedback: 'Тут потрібен вираз без знака «=».' }
  const eq = expressionsEquivalent(raw, spec.value)
  if (eq === null) return UNREADABLE
  if (!eq) return { correct: false }
  if (spec.rejectLiteral) {
    const n = normalizeMath(raw).replace(/\s+/g, '')
    if (spec.rejectLiteral.some((r) => normalizeMath(r).replace(/\s+/g, '') === n)) {
      return { correct: false, feedback: spec.rejectMessage ?? 'Вираз правильний, але його потрібно ще перетворити (спростити / розкласти / звести до потрібного вигляду).' }
    }
  }
  return { correct: true }
}

function sidesToFunction(eq: string) {
  const parts = eq.split('=')
  if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return null
  const node = compileExpr(`(${parts[0]}) - (${parts[1]})`)
  return node
}

function checkEquation(spec: Extract<AnswerSpec, { kind: 'equation' }>, input: string): CheckResult {
  if (!input.includes('=')) return { correct: false, unreadable: true, feedback: 'Запиши рівняння зі знаком «=», наприклад y = 2x + 1.' }
  const fa = sidesToFunction(input)
  const fb = sidesToFunction(spec.value)
  if (!fa || !fb) return UNREADABLE
  const vars = [...new Set([...variablesOf(fa), ...variablesOf(fb)])].sort()
  const base = [0.7, -1.9, 2.4, 3.1, -0.45, 5.2, -2.7, 1.3, 4.3, -3.6, 0.35, 6.1]
  let ratio: number | null = null
  let usable = 0
  for (let i = 0; i < 16; i++) {
    const scope: Record<string, number> = {}
    vars.forEach((v, j) => (scope[v] = base[(i * (j + 2) + j * 5) % base.length] + (i % 4) * 0.1 * (j + 1)))
    const a = evalAt(fa, scope)
    const b = evalAt(fb, scope)
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue
    if (Math.abs(b) < 1e-9) {
      if (Math.abs(a) > 1e-6) return { correct: false }
      continue
    }
    const r = a / b
    if (Math.abs(r) < 1e-9) return { correct: false }
    if (ratio === null) ratio = r
    else if (!closeTo(r, ratio, 1e-6)) return { correct: false }
    usable++
  }
  return { correct: usable >= 4 }
}

function checkNumberSet(spec: Extract<AnswerSpec, { kind: 'numberSet' }>, input: string): CheckResult {
  const s = input.trim()
  if (spec.values.length === 0) {
    if (EMPTY_SET_RE.test(s)) return { correct: true }
    return { correct: false }
  }
  if (!s || EMPTY_SET_RE.test(s)) return { correct: false }
  let readable = false
  for (const parts of splitCandidates(s)) {
    const nums = parseNumberList(parts)
    if (!nums) continue
    readable = true
    if (setsEqual(nums, spec.values)) return { correct: true }
  }
  if (!readable) return UNREADABLE
  return { correct: false }
}

function checkTuple(spec: Extract<AnswerSpec, { kind: 'tuple' }>, input: string): CheckResult {
  let readable = false
  for (const parts of splitCandidates(input)) {
    const nums = parseNumberList(parts)
    if (!nums) continue
    readable = true
    if (nums.length === spec.values.length && nums.every((v, i) => closeTo(v, spec.values[i], 1e-6))) return { correct: true }
  }
  if (!readable) return UNREADABLE
  return { correct: false }
}

function checkInterval(spec: Extract<AnswerSpec, { kind: 'interval' }>, input: string): CheckResult {
  const got = parseIntervals(input)
  const want = parseIntervals(spec.value)
  if (!want) throw new Error(`Invalid interval spec: ${spec.value}`)
  if (!got) return { ...UNREADABLE, feedback: 'Не вдалося розпізнати проміжок. Приклад: (-∞; 3] або [1; 5) ∪ (7; +∞).' }
  return { correct: intervalsEqual(got, want) }
}

function checkChoice(spec: Extract<AnswerSpec, { kind: 'choice' }>, input: string): CheckResult {
  const picked = input
    .split(/[,;\s]+/)
    .filter((x) => /^\d+$/.test(x))
    .map(Number)
  const a = [...new Set(picked)].sort((x, y) => x - y)
  const b = [...spec.correct].sort((x, y) => x - y)
  if (a.length === 0) return { correct: false, unreadable: true, feedback: 'Обери варіант відповіді.' }
  return { correct: a.length === b.length && a.every((v, i) => v === b[i]) }
}

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’ʼ`´']/g, "'")
    .replace(/ё/g, 'е')
    .replace(/[.!?,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function checkText(spec: Extract<AnswerSpec, { kind: 'text' }>, input: string): CheckResult {
  const n = normalizeText(input)
  if (!n) return { correct: false, unreadable: true }
  return { correct: spec.accept.some((a) => normalizeText(a) === n) }
}

/** Перевірити відповідь учня. Ніколи не кидає винятків на «дивному» вводі. */
export function checkAnswer(spec: AnswerSpec, input: string): CheckResult {
  const text = input.trim()
  if (!text) return { correct: false, unreadable: true, feedback: 'Спочатку введи відповідь.' }
  try {
    switch (spec.kind) {
      case 'number':
        return checkNumber(spec, text)
      case 'expression':
        return checkExpression(spec, text)
      case 'equation':
        return checkEquation(spec, text)
      case 'numberSet':
        return checkNumberSet(spec, text)
      case 'tuple':
        return checkTuple(spec, text)
      case 'interval':
        return checkInterval(spec, text)
      case 'choice':
        return checkChoice(spec, text)
      case 'text':
        return checkText(spec, text)
    }
  } catch {
    return UNREADABLE
  }
}

function fmtNum(v: number): string {
  if (Number.isInteger(v)) return String(v)
  const r = Math.round(v * 1e6) / 1e6
  return String(r).replace('.', ',')
}

/** Правильна відповідь простим текстом (для показу «Правильна відповідь:» і для бота). */
export function answerToText(spec: AnswerSpec): string {
  switch (spec.kind) {
    case 'number':
      return fmtNum(spec.value) + (spec.unit ? ' ' + spec.unit : '')
    case 'expression':
    case 'equation':
    case 'interval':
      return spec.value
    case 'numberSet':
      return spec.values.length ? spec.values.map(fmtNum).join('; ') : 'розв’язків немає'
    case 'tuple':
      return '(' + spec.values.map(fmtNum).join('; ') + ')'
    case 'choice':
      return spec.correct.map((i) => spec.options[i]).join('; ')
    case 'text':
      return spec.accept[0] ?? ''
  }
}
