import { parse, evaluate, type MathNode } from 'mathjs/number'

/**
 * Розбір «шкільного» запису: десяткова кома, √, ², ×, ·, ÷, tg/ctg, |x|, кирилична «х» тощо.
 * Нічого не знає про те, правильна відповідь чи ні — лише перетворює текст у вираз mathjs.
 */

const CYR_TO_LAT: Record<string, string> = {
  х: 'x', у: 'y', а: 'a', с: 'c', е: 'e', к: 'k', м: 'm', о: 'o', р: 'p', т: 't', в: 'b', і: 'i', г: 'g', н: 'n', д: 'd', л: 'l',
  Х: 'x', У: 'y', А: 'a', С: 'c', Е: 'e', К: 'k', М: 'm', О: 'o', Р: 'p', Т: 't', В: 'b', І: 'i', Г: 'g', Н: 'n', Д: 'd', Л: 'l',
}

const SUPERSCRIPTS: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }

/** Імена функцій, які користувач може написати по-українськи. */
const FUNCTION_ALIASES: [RegExp, string][] = [
  [/\barcctg\b|\barccot\b/g, 'acot'],
  [/\barcsin\b/g, 'asin'],
  [/\barccos\b/g, 'acos'],
  [/\barctg\b|\barctan\b/g, 'atan'],
  [/\bctg\b|\bcot\b/g, 'cot'],
  [/\btg\b|\btan\b/g, 'tan'],
  [/\blg\b/g, 'log10'],
  [/\bln\b/g, 'log'],
]

const KNOWN_FUNCS = ['sin', 'cos', 'tan', 'cot', 'asin', 'acos', 'atan', 'acot', 'log10', 'log2', 'log', 'sqrt', 'cbrt', 'abs', 'exp']
const CONSTANTS = new Set(['pi', 'e'])

/** Перетворює введений рядок на рядок, який розуміє mathjs. Не кидає винятків. */
export function normalizeMath(input: string): string {
  let s = input.trim()
  // кирилічні двійники латинських змінних (але не слова на кшталт «або»)
  s = s.replace(/[А-Яа-яІіЇїЄє]/g, (ch) => CYR_TO_LAT[ch] ?? ch)
  s = s.toLowerCase()
  s = s.replace(/[−–—‒]/g, '-').replace(/[×·⋅∙]/g, '*').replace(/÷/g, '/')
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^' + [...m].map((c) => SUPERSCRIPTS[c]).join(''))
  s = s.replace(/π/g, 'pi').replace(/°/g, '').replace(/%/g, '')
  s = s.replace(/∞/g, 'Infinity')
  // коренi: ∛x, √x, √(...)
  s = s.replace(/∛\s*(\([^)]*\)|[a-z0-9.]+)/g, (_m, a) => `cbrt(${stripParens(a)})`)
  s = s.replace(/√\s*(\([^)]*\)|\d+(?:\.\d+)?|[a-z]+)/g, (_m, a) => `sqrt(${stripParens(a)})`)
  s = s.replace(/(\d),(\d)/g, '$1.$2')
  for (const [re, to] of FUNCTION_ALIASES) s = s.replace(re, to)
  // sin x → sin(x), sqrt 3 → sqrt(3)
  const fnRe = new RegExp(`\\b(${KNOWN_FUNCS.join('|')})\\s+(-?[a-z0-9.]+)`, 'g')
  s = s.replace(fnRe, '$1($2)')
  // |x - 1| → abs(x - 1) (без вкладеності)
  for (let i = 0; i < 4 && s.includes('|'); i++) s = s.replace(/\|([^|]+)\|/, 'abs($1)')
  // пробіли між цифрами та змінними — неявне множення; зайві пробіли прибираємо
  s = s.replace(/\s+/g, ' ')
  return s
}

function stripParens(a: string): string {
  return a.startsWith('(') && a.endsWith(')') ? a.slice(1, -1) : a
}

/** Обчислює числове значення виразу ("2√3", "3/4", "-1,5", "1 1/2"). null — не розпізнано. */
export function evalNumber(input: string): number | null {
  let s = input.trim()
  if (!s) return null
  // мішане число «1 1/2»
  const mixed = s.replace(/−/g, '-').match(/^(-?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixed) {
    const [, sign, w, n, d] = mixed
    if (Number(d) === 0) return null
    const v = Number(w) + Number(n) / Number(d)
    return sign === '-' ? -v : v
  }
  s = normalizeMath(s)
  if (/^[+-]?infinity$/.test(s.replace(/\s/g, ''))) return s.trim().startsWith('-') ? -Infinity : Infinity
  try {
    const v = evaluate(s)
    return typeof v === 'number' && Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

export function compileExpr(input: string): MathNode | null {
  try {
    return parse(normalizeMath(input))
  } catch {
    return null
  }
}

/** Змінні, що зустрічаються у виразі (без констант та імен функцій). */
export function variablesOf(node: MathNode): string[] {
  const vars = new Set<string>()
  node.traverse((n: MathNode, path: string, parent: MathNode | null) => {
    if (n.type !== 'SymbolNode') return
    if (parent && parent.type === 'FunctionNode' && path === 'fn') return
    const name = (n as unknown as { name: string }).name
    if (!CONSTANTS.has(name)) vars.add(name)
  })
  return [...vars].sort()
}

/** Обчислити вираз при заданих значеннях змінних; NaN, якщо не визначено. */
export function evalAt(node: MathNode, scope: Record<string, number>): number {
  try {
    const v = node.evaluate(scope)
    return typeof v === 'number' ? v : NaN
  } catch {
    return NaN
  }
}

/** Чи збігаються числа з урахуванням відносної похибки. */
export function closeTo(a: number, b: number, tol = 1e-6): boolean {
  if (a === b) return true
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b))
}

// Детермінований набір точок для перевірки еквівалентності.
const SAMPLE_BASE = [0.7, -1.9, 2.4, 3.1, -0.45, 5.2, -2.7, 1.3, 4.3, -3.6, 0.35, 6.1, -1.15, 2.05]

/** Чи рівні вирази як функції (числова перевірка у багатьох точках). */
export function expressionsEquivalent(a: string, b: string): boolean | null {
  const na = compileExpr(a)
  const nb = compileExpr(b)
  if (!na || !nb) return null
  const vars = [...new Set([...variablesOf(na), ...variablesOf(nb)])].sort()
  let valid = 0
  const total = vars.length === 0 ? 1 : 24
  for (let i = 0; i < total; i++) {
    const scope: Record<string, number> = {}
    vars.forEach((v, j) => {
      scope[v] = SAMPLE_BASE[(i * (j + 2) + j * 3) % SAMPLE_BASE.length] + (i % 3) * 0.013 * (j + 1)
    })
    const va = evalAt(na, scope)
    const vb = evalAt(nb, scope)
    const fa = Number.isFinite(va)
    const fb = Number.isFinite(vb)
    if (!fa && !fb) continue
    if (fa !== fb) return false
    if (!closeTo(va, vb, 1e-7)) return false
    valid++
  }
  return valid >= Math.min(5, total)
}
