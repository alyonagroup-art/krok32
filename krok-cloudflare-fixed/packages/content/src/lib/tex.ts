/**
 * Допоміжні функції для генераторів задач: акуратний LaTeX (знаки, дужки, дроби, корені),
 * щоб у задачах не з'являлося «+ -3x» чи «1x^1».
 * Усі функції повертають LaTeX БЕЗ обгортки $...$.
 */

export const gcd = (a: number, b: number): number => {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}
export const lcm = (a: number, b: number): number => (a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcd(a, b))

export const isPerfectSquare = (n: number): boolean => n >= 0 && Number.isInteger(Math.sqrt(n))

/** Десяткове число з комою: 1{,}5 (у KaTeX кома без пробілу). */
export function dec(v: number, maxDigits = 6): string {
  const r = Number(v.toFixed(maxDigits))
  const s = String(r)
  const out = s.includes('e') ? r.toFixed(maxDigits).replace(/0+$/, '') : s
  return out.replace('-', '-').replace('.', '{,}')
}

/** Число: ціле або десяткове з комою. */
export function num(n: number): string {
  return Number.isInteger(n) ? String(n) : dec(n)
}

/** Число у дужках, якщо від'ємне: (-3). Для підстановки у вирази. */
export function paren(n: number): string {
  return n < 0 ? `(${num(n)})` : num(n)
}

/** « + 3» або « - 3» — для дописування доданка. */
export function signed(n: number): string {
  return n < 0 ? ` - ${num(-n)}` : ` + ${num(n)}`
}

/** Нескоротний дріб \frac{n}{d} (знак — перед дробом). Ціле, якщо d ділить n. */
export function frac(n: number, d = 1): string {
  if (d === 0) throw new Error('frac: denominator is 0')
  const g = gcd(n, d) || 1
  let a = n / g
  let b = d / g
  if (b < 0) {
    a = -a
    b = -b
  }
  if (b === 1) return String(a)
  return a < 0 ? `-\\frac{${-a}}{${b}}` : `\\frac{${a}}{${b}}`
}

/** Дріб без скорочення (для умов): \frac{6}{8}. Знак лише у чисельнику. */
export function fracRaw(n: number, d: number): string {
  if (d < 0) {
    n = -n
    d = -d
  }
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`
}

/** Значення дробу як число (для відповіді kind: 'number'). */
export const ratio = (n: number, d: number): number => n / d

/** Один доданок c·v^p. first = перший у виразі (без початкового «+»). */
export function term(c: number, v = 'x', p = 1, first = true): string {
  if (c === 0) return ''
  const abs = Math.abs(c)
  const sign = c < 0 ? '-' : first ? '' : '+'
  const pow = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`
  const coef = p !== 0 && abs === 1 ? '' : num(abs)
  const body = `${coef}${pow}` || '1'
  return first ? `${sign}${body}` : ` ${sign} ${body}`
}

/** Многочлен за коефіцієнтами від старшого степеня: [1,-4,4] → x^{2} - 4x + 4. */
export function poly(coeffs: number[], v = 'x'): string {
  const n = coeffs.length - 1
  let out = ''
  coeffs.forEach((c, i) => {
    if (c === 0) return
    out += term(c, v, n - i, out === '')
  })
  return out || '0'
}

/** ax + b */
export const linear = (a: number, b: number, v = 'x'): string => poly([a, b], v)

/** Спрощений корінь: sqrt(n) = outer * sqrt(inner). */
export function simplifySqrt(n: number): [number, number] {
  let outer = 1
  let inner = n
  for (let f = 2; f * f <= inner; f++) {
    while (inner % (f * f) === 0) {
      inner /= f * f
      outer *= f
    }
  }
  return [outer, inner]
}

/** √n у спрощеному вигляді: 12 → 2\sqrt{3}, 16 → 4. */
export function sqrtTex(n: number): string {
  const [o, i] = simplifySqrt(n)
  if (i === 1) return String(o)
  return `${o === 1 ? '' : o}\\sqrt{${i}}`
}

/** Множина коренів: \{2;\,-3\}. */
export function setTex(values: number[]): string {
  if (values.length === 0) return '\\varnothing'
  return `\\{${values.map(num).join(';\\,')}\\}`
}

/** Система рівнянь. */
export function system(...eqs: string[]): string {
  return `\\begin{cases} ${eqs.join(' \\\\ ')} \\end{cases}`
}

/** Округлення до k знаків (число). */
export const round = (v: number, k = 2): number => Number(v.toFixed(k))

/** Нормалізація «-0» → 0. */
export const noNegZero = (n: number): number => (Object.is(n, -0) ? 0 : n)
