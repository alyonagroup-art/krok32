import type { Problem, Figure, FigureItem } from '@krok/core'
import { choiceAnswer, exercise, topicFactory } from '../../lib'

const topic = topicFactory('algebra', 10)

type Op = '>' | '<' | '>=' | '<='
type Root = { r: number; m: number }
interface Iv {
  lo: number
  hi: number
  loInc: boolean
  hiInc: boolean
}

const opTex = (op: Op) => ({ '>': '>', '<': '<', '>=': '\\ge', '<=': '\\le' })[op]
const opWord = (op: Op) => ({ '>': 'додатний', '<': 'від’ємний', '>=': 'невід’ємний (додатний або нуль)', '<=': 'недодатний (від’ємний або нуль)' })[op]
const strict = (op: Op) => op === '>' || op === '<'
const wantPositive = (op: Op) => op === '>' || op === '>='

const fac = (r: number, m: number, lead = 1): string => {
  const base = lead === 1 ? (r === 0 ? 'x' : r > 0 ? `(x - ${r})` : `(x + ${-r})`) : r === 0 ? '(-x)' : `(${r} - x)`
  if (m === 1) return base
  return base.startsWith('(') ? `${base}^{${m}}` : `${base}^{${m}}`
}
const prodTex = (roots: Root[], lead: 1 | -1 = 1) => (roots.length === 0 ? '1' : roots.map((x) => fac(x.r, x.m, lead)).join(''))

function sgn(x: number) {
  return x > 0 ? 1 : x < 0 ? -1 : 0
}
/** Знак f(t) для f = lead · Π(x−r)^m / Π(x−r)^m. */
function signAt(t: number, num: Root[], den: Root[], lead: number): number {
  let s = lead
  for (const { r, m } of num) s *= sgn(t - r) ** m
  for (const { r, m } of den) s *= sgn(t - r) ** m
  return s
}

function solve(numR: Root[], denR: Root[], op: Op, lead: 1 | -1 = 1) {
  const crit = [...new Set([...numR, ...denR].map((x) => x.r))].sort((a, b) => a - b)
  const pos = wantPositive(op)
  const pieces: Iv[] = []
  const edges = [-Infinity, ...crit, Infinity]
  const signs: number[] = []
  for (let i = 0; i < edges.length - 1; i++) {
    const lo = edges[i]
    const hi = edges[i + 1]
    const t = lo === -Infinity ? hi - 1 : hi === Infinity ? lo + 1 : (lo + hi) / 2
    const s = signAt(t, numR, denR, lead)
    signs.push(s)
    if ((pos && s > 0) || (!pos && s < 0)) pieces.push({ lo, hi, loInc: false, hiInc: false })
  }
  if (!strict(op)) {
    for (const c of crit) if (!denR.some((d) => d.r === c)) pieces.push({ lo: c, hi: c, loInc: true, hiInc: true })
  }
  // злиття дотичних/перекритих фрагментів
  pieces.sort((a, b) => a.lo - b.lo || Number(b.loInc) - Number(a.loInc))
  const out: Iv[] = []
  for (const p of pieces) {
    const last = out[out.length - 1]
    if (last && (p.lo < last.hi || (p.lo === last.hi && (p.loInc || last.hiInc)))) {
      if (p.hi > last.hi || (p.hi === last.hi && p.hiInc)) {
        last.hi = p.hi
        last.hiInc = p.hiInc
      }
    } else out.push({ ...p })
  }
  return { crit, signs, intervals: out }
}

const spec = (ivs: Iv[]) =>
  ivs.length === 0
    ? '∅'
    : ivs
        .map((i) => (i.lo === i.hi ? `{${i.lo}}` : `${i.loInc ? '[' : '('}${i.lo === -Infinity ? '-inf' : i.lo}; ${i.hi === Infinity ? '+inf' : i.hi}${i.hiInc ? ']' : ')'}`))
        .join(' U ')
const tex = (ivs: Iv[]) =>
  ivs.length === 0
    ? '\\varnothing'
    : ivs
        .map((i) => (i.lo === i.hi ? `\\{${i.lo}\\}` : `${i.loInc ? '[' : '('}${i.lo === -Infinity ? '-\\infty' : i.lo};\\, ${i.hi === Infinity ? '+\\infty' : i.hi}${i.hiInc ? ']' : ')'}`))
        .join(' \\cup ')

/** Числова пряма зі знаками на проміжках. */
function signLine(crit: number[], signs: number[], denom: number[], solid: number[]): Figure {
  const lo = crit[0] - 1.6
  const hi = crit[crit.length - 1] + 1.6
  const items: FigureItem[] = [{ t: 'arrow', a: [lo, 0], b: [hi, 0] }]
  crit.forEach((c) => {
    const filled = solid.includes(c) && !denom.includes(c)
    items.push({ t: 'dot', at: [c, 0], hollow: !filled, color: 'ink' })
    items.push({ t: 'text', at: [c - 0.15, -0.55], text: String(c) })
  })
  const edges = [lo, ...crit, hi]
  signs.forEach((s, i) => {
    items.push({ t: 'text', at: [(edges[i] + edges[i + 1]) / 2 - 0.12, 0.55], text: s > 0 ? '+' : s < 0 ? '−' : '0', color: s > 0 ? 'green' : 'red', size: 20 })
  })
  return { view: [lo - 0.3, -1, hi + 0.3, 1.1], width: Math.min(560, 90 * (crit.length + 2)), items }
}

function build(prompt: string, numR: Root[], denR: Root[], op: Op, lead: 1 | -1, extra: string[] = []): Problem {
  const { crit, signs, intervals } = solve(numR, denR, op, lead)
  const exprTex = `${denR.length ? `\\dfrac{${prodTex(numR, lead)}}{${prodTex(denR)}}` : prodTex(numR, lead)}`
  const edges = [-Infinity, ...crit, Infinity]
  const signLines = signs.map((s, i) => {
    const a = edges[i] === -Infinity ? '-\\infty' : String(edges[i])
    const b = edges[i + 1] === Infinity ? '+\\infty' : String(edges[i + 1])
    return `$(${a};\\, ${b})$: знак $${s > 0 ? '+' : '-'}$`
  })
  const answer = spec(intervals)
  const mult = [...numR, ...denR].filter((x) => x.m % 2 === 0)
  const solid = strict(op) ? [] : numR.map((x) => x.r)
  void exprTex
  return {
    prompt,
    figure: signLine(crit, signs, denR.map((d) => d.r), solid),
    answer: { kind: 'interval', value: answer },
    answerTex: tex(intervals),
    inputHint: 'Запиши проміжок, напр. (-∞; 2] ∪ (5; +∞). Відповідь може складатися з кількох проміжків і окремих точок {a}.',
    hints: [
      'Знайди «критичні точки»: числа, у яких чисельник або знаменник дорівнює нулю. Познач їх на числовій прямій.',
      `Визнач знак виразу на кожному проміжку (достатньо перевірити по одній точці з проміжку; при переході через корінь непарної кратності знак змінюється, парної — ні).`,
      `Обери проміжки, де вираз ${opWord(op)}. Нулі знаменника завжди виколоті${strict(op) ? '' : ', нулі чисельника — зафарбовані (нерівність нестрога)'}.`,
    ],
    solution: [
      ...extra,
      `Критичні точки: ${crit.map((c) => `$${c}$`).join(', ')}${denR.length ? ` (нулі знаменника: ${denR.map((d) => `$${d.r}$`).join(', ')} — виколоті)` : ''}.`,
      `Знаки на проміжках: ${signLines.join('; ')}.`,
      mult.length ? `Через корінь парної кратності ($${mult.map((x) => x.r).join(',\\ ')}$) знак не змінюється.` : 'Усі корені непарної кратності, тому знаки чергуються.',
      `Потрібен знак «${wantPositive(op) ? '+' : '−'}»${strict(op) ? '' : ', а також нулі чисельника'}: $x \\in ${tex(intervals)}$.`,
    ],
    steps: [
      {
        prompt: 'Знайди критичні точки (нулі чисельника й знаменника). Введи їх через «;».',
        answer: { kind: 'numberSet', values: crit },
        hint: 'Прирівняй кожен множник до нуля.',
        explanation: `Критичні точки: ${crit.join('; ')}.`,
      },
      {
        prompt: `Який знак має вираз на **крайньому правому** проміжку (правіше за всі точки)? Введи «+» або «−».`,
        answer: { kind: 'text', accept: signs[signs.length - 1] > 0 ? ['+', 'плюс'] : ['-', '−', 'мінус'] },
        hint: `Підстав велике число, наприклад ${crit[crit.length - 1] + 10}.`,
        explanation: `Знак на крайньому правому проміжку: «${signs[signs.length - 1] > 0 ? '+' : '−'}».`,
      },
      {
        prompt: 'Запиши відповідь.',
        answer: { kind: 'interval', value: answer },
        explanation: `$x \\in ${tex(intervals)}$.`,
      },
    ],
  }
}

const opSym = (op: Op) => opTex(op)
const pickOp = (rng: { pick: <T>(a: readonly T[]) => T }): Op => rng.pick(['>', '<', '>=', '<='] as const)
const sortedRoots = (rng: { ints: (n: number, a: number, b: number, o?: { distinct?: boolean }) => number[] }, n: number, lo = -6, hi = 6) => rng.ints(n, lo, hi, { distinct: true }).sort((a, b) => a - b)

export default topic('a10-1', {
  id: 'a10-interval-method',
  title: 'Метод інтервалів і раціональні нерівності',
  summary: 'Універсальний спосіб розв’язувати нерівності виду P(x)/Q(x) ∨ 0: розкласти на множники, поставити точки, розставити знаки.',
  prereqs: [],
  estMinutes: 45,
  tags: ['нерівності', 'метод інтервалів'],

  lesson: [
    {
      title: 'Ідея: знак змінюється тільки в нулях',
      blocks: [
        {
          type: 'intuition',
          md: 'Уяви функцію як дорогу над землею. Поки вона не перетинає землю (вісь $Ox$), вона або весь час вище (знак «+»), або весь час нижче (знак «−»). Змінити знак вона може **лише там, де дорівнює нулю** — або там, де її взагалі нема (знаменник $=0$). Тому достатньо знайти ці «особливі» точки, а далі на кожному проміжку між ними перевірити знак в одній точці. Це і є **метод інтервалів**.',
        },
        {
          type: 'rule',
          title: 'Куди ставити точки',
          md: '- Нулі **чисельника**: зафарбовані ● у нестрогій нерівності ($\\ge$, $\\le$), виколоті ○ у строгій.\n- Нулі **знаменника**: завжди виколоті ○ (ділити на нуль не можна).',
        },
        {
          type: 'rule',
          title: 'Чергування знаків',
          md: 'Нехай $(x-a)^m$ — множник. Якщо **$m$ непарне** — при переході через $a$ знак **змінюється**. Якщо **$m$ парне** — знак **не змінюється** (вираз торкається осі й повертається).',
        },
      ],
    },
    {
      title: 'Алгоритм',
      blocks: [
        {
          type: 'algorithm',
          title: 'Як розв’язати нерівність методом інтервалів',
          steps: [
            'Перенеси все в одну частину, щоб справа був $0$; зведи до одного дробу.',
            'Розклади чисельник і знаменник на множники виду $(x-a)$ (корені $a$ знайди з рівнянь).',
            'Познач усі корені на числовій прямій: нулі знаменника — виколоті, нулі чисельника — за знаком нерівності.',
            'Визнач знак на крайньому правому проміжку (при $x \\to +\\infty$): «+», якщо старший коефіцієнт додатний.',
            'Рухаючись ліворуч, розстав знаки: через корінь непарної кратності знак змінюється, парної — ні.',
            'Обери проміжки з потрібним знаком. Не забудь про окремі точки, де вираз $=0$ (нестрога нерівність), навіть якщо поруч знак «не той».',
          ],
        },
        {
          type: 'warning',
          md: 'Не **скорочуй** на множник із $x$ і не множ обидві частини на вираз зі змінною: можеш загубити або придбати корені, а знак нерівності залежатиме від знака множника. Переносимо все в одну частину й розкладаємо.',
        },
        {
          type: 'check',
          question: 'Скільки разів змінюється знак виразу $(x-1)^2(x+3)(x-5)$ при русі зліва направо?',
          answer: '$2$ рази',
          explain: 'Корені $-3$ і $5$ непарної кратності — знак змінюється; корінь $1$ парної кратності ($2$) — ні.',
        },
      ],
    },
  ],

  examples: [
    {
      title: 'Добуток трьох множників',
      problem: 'Розв’яжіть нерівність $(x-1)(x+2)(x-4) > 0$.',
      steps: [
        { think: 'Праворуч нуль, вираз уже розкладено. Нулі: $-2$, $1$, $4$. Нерівність строга — точки виколоті.', do: 'Критичні точки: $-2,\\ 1,\\ 4$.' },
        { think: 'Старший коефіцієнт додатний, тож праворуч від $4$ знак «+». Далі чергуємо: усі корені непарної кратності.', do: 'Знаки зліва направо: $-,\\ +,\\ -,\\ +$.' },
        { do: 'Потрібен «+»: $(-2;\\, 1)$ та $(4;\\, +\\infty)$.' },
      ],
      answer: '$x \\in (-2;\\, 1) \\cup (4;\\, +\\infty)$',
    },
    {
      title: 'Дробова нерівність',
      problem: 'Розв’яжіть нерівність $\\dfrac{x-3}{x+1} \\le 0$.',
      steps: [
        { think: 'Нуль чисельника $3$ — зафарбуємо (нестрога). Нуль знаменника $-1$ — виколемо завжди.', do: 'Точки: $-1$ (○), $3$ (●).' },
        { do: 'Праворуч від $3$ знак «+». Зліва направо: $+,\\ -,\\ +$.' },
        { think: 'Потрібен «−» або нуль.', do: '$x \\in (-1;\\, 3]$.' },
      ],
      answer: '$x \\in (-1;\\, 3]$',
    },
    {
      title: 'Корінь парної кратності',
      problem: 'Розв’яжіть нерівність $(x-2)^2(x+1) \\ge 0$.',
      steps: [
        { do: 'Точки: $-1$ (кратність 1), $2$ (кратність 2). Праворуч — «+».' },
        { think: 'Через $2$ знак не змінюється (парна кратність): $-,\\ +,\\ +$.', do: 'Зліва направо: на $(-\\infty;-1)$ знак «−», на $(-1;2)$ і $(2;+\\infty)$ — «+».' },
        { think: 'Нестрога нерівність: нулі $-1$ і $2$ входять. Точка $2$ уже всередині проміжку з «+», тож зливається з ним.', do: '$x \\in [-1;\\, +\\infty)$.' },
      ],
      answer: '$x \\in [-1;\\, +\\infty)$',
    },
    {
      title: 'Ізольована точка',
      problem: 'Розв’яжіть нерівність $(x-1)^2(x-3) \\le 0$.',
      steps: [
        { do: 'Точки: $1$ (парна кратність), $3$. Праворуч «+», зліва направо: $-,\\ -,\\ +$.' },
        { do: 'Потрібен «−» або нуль: $(-\\infty;\\, 3]$, адже $x=1$ теж дає нуль і вже лежить усередині.' },
      ],
      answer: '$x \\in (-\\infty;\\, 3]$',
    },
  ],

  formulas: [
    { title: 'Знак при переході через корінь', tex: '(x-a)^m:\\ m\\text{ непарне — знак змінюється, парне — ні}' },
    { title: 'Нулі знаменника', tex: 'Q(x)=0 \\Rightarrow \\text{точка завжди виколота}' },
    { title: 'Рівносильність', tex: '\\dfrac{P(x)}{Q(x)} \\ge 0 \\iff \\begin{cases} P(x)\\,Q(x) \\ge 0 \\\\ Q(x) \\ne 0 \\end{cases}' },
  ],

  mistakes: [
    { wrong: 'У нерівності $\\dfrac{x-3}{x+1} \\le 0$ відповідь $[-1;\\, 3]$.', why: 'Нуль знаменника не можна включати.', right: '$(-1;\\, 3]$' },
    { wrong: 'Знак чергується завжди, навіть через $(x-2)^2$.', why: 'Через корінь парної кратності знак не змінюється.', right: 'Чергуємо лише через непарні кратності.' },
    { wrong: 'У нерівності $(x-2)^2(x+1) > 0$ відповідь $(-1;\\, +\\infty)$.', why: 'Точка $x=2$ дає $0$, а нерівність строга — її треба виколоти.', right: '$(-1;\\, 2) \\cup (2;\\, +\\infty)$' },
    { wrong: 'Ділять обидві частини на вираз із $x$, не думаючи про його знак.', why: 'Знак нерівності залежить від знака множника — можна помилитись.', right: 'Переносити все в одну частину й розкладати.' },
  ],

  exercises: [
    exercise('quad-given-roots', 1, 'Квадратна нерівність, розкладена на множники', (rng) => {
      const [a, b] = sortedRoots(rng, 2)
      const op = pickOp(rng)
      return build(`Розв’яжіть нерівність $${prodTex([{ r: a, m: 1 }, { r: b, m: 1 }])} ${opSym(op)} 0$.`, [{ r: a, m: 1 }, { r: b, m: 1 }], [], op, 1)
    }),

    exercise('expanded-quadratic', 2, 'Розкласти квадратний тричлен і розв’язати', (rng) => {
      const [a, b] = sortedRoots(rng, 2)
      const op = pickOp(rng)
      const p = -(a + b)
      const q = a * b
      const poly = `x^{2} ${p === 0 ? '' : p > 0 ? `+ ${p === 1 ? '' : p}x` : `- ${p === -1 ? '' : -p}x`} ${q > 0 ? `+ ${q}` : q < 0 ? `- ${-q}` : ''}`.split(' ').filter(Boolean).join(' ')
      return build(`Розв’яжіть нерівність $${poly} ${opSym(op)} 0$.`, [{ r: a, m: 1 }, { r: b, m: 1 }], [], op, 1, [`Знайдемо корені $${poly} = 0$ (за теоремою Вієта: сума $${-p}$, добуток $${q}$): $x_1 = ${a}$, $x_2 = ${b}$. Тоді $${poly} = (x ${a > 0 ? '-' : '+'} ${Math.abs(a)})(x ${b > 0 ? '-' : '+'} ${Math.abs(b)})$.`])
    }),

    exercise('three-factors', 2, 'Добуток трьох множників', (rng) => {
      const roots = sortedRoots(rng, 3)
      const op = pickOp(rng)
      const nr = roots.map((r) => ({ r, m: 1 }))
      return build(`Розв’яжіть нерівність $${prodTex(nr)} ${opSym(op)} 0$.`, nr, [], op, 1)
    }),

    exercise('simple-fraction', 2, 'Дробова нерівність (x−a)/(x−b)', (rng) => {
      const [a, b] = rng.ints(2, -6, 6, { distinct: true })
      const op = pickOp(rng)
      return build(`Розв’яжіть нерівність $\\dfrac{${prodTex([{ r: a, m: 1 }])}}{${prodTex([{ r: b, m: 1 }])}} ${opSym(op)} 0$.`, [{ r: a, m: 1 }], [{ r: b, m: 1 }], op, 1)
    }),

    exercise('two-over-one', 3, 'Дробова нерівність із трьома точками', (rng) => {
      const roots = rng.ints(3, -6, 6, { distinct: true })
      const op = pickOp(rng)
      const numR = [roots[0], roots[1]].sort((a, b) => a - b).map((r) => ({ r, m: 1 }))
      const denR = [{ r: roots[2], m: 1 }]
      return build(`Розв’яжіть нерівність $\\dfrac{${prodTex(numR)}}{${prodTex(denR)}} ${opSym(op)} 0$.`, numR, denR, op, 1)
    }),

    exercise('even-multiplicity', 3, 'Корінь парної кратності', (rng) => {
      const [a, b] = rng.ints(2, -5, 5, { distinct: true })
      const op = pickOp(rng)
      const withDen = rng.chance(0.4)
      const numR = withDen ? [{ r: a, m: 2 }] : [{ r: a, m: 2 }, { r: b, m: 1 }]
      const denR = withDen ? [{ r: b, m: 1 }] : []
      const body = withDen ? `\\dfrac{${prodTex(numR)}}{${prodTex(denR)}}` : prodTex(numR.sort((x, y) => x.r - y.r))
      return build(`Розв’яжіть нерівність $${body} ${opSym(op)} 0$.`, numR.sort((x, y) => x.r - y.r), denR, op, 1)
    }),

    exercise('negative-leading', 3, 'Множник виду (c − x)', (rng) => {
      const [a, b] = sortedRoots(rng, 2)
      const op = pickOp(rng)
      // (a - x)(x - b) : старший коефіцієнт від'ємний, корені a і b
      const text = `(${a} - x)(x ${b > 0 ? '-' : '+'} ${Math.abs(b)})`
      // Рахуємо через lead = -1 і корені a,b (множники (x-a)(x-b) з множником −1)
      return build(`Розв’яжіть нерівність $${text} ${opSym(op)} 0$.`, [{ r: a, m: 1 }, { r: b, m: 1 }], [], op, -1, ['Множник $(c - x)$ дорівнює $-(x - c)$, тому старший коефіцієнт добутку від’ємний: крайній правий проміжок має знак «−».'])
    }),

    exercise('count-integers', 2, 'Кількість цілих розв’язків', (rng) => {
      const [a, b] = rng.ints(2, -8, 8, { distinct: true }).sort((x, y) => x - y)
      const strictLess = rng.chance(0.5)
      const op: Op = strictLess ? '<' : '<='
      const { intervals } = solve([{ r: a, m: 1 }, { r: b, m: 1 }], [], op, 1)
      let count = 0
      for (let k = a - 1; k <= b + 1; k++) if (intervals.some((i) => (k > i.lo || (k === i.lo && i.loInc)) && (k < i.hi || (k === i.hi && i.hiInc)))) count++
      return {
        prompt: `Скільки цілих розв’язків має нерівність $${prodTex([{ r: a, m: 1 }, { r: b, m: 1 }])} ${opSym(op)} 0$?`,
        answer: { kind: 'number', value: count },
        hints: ['Спочатку розв’яжи нерівність методом інтервалів, отримай проміжок.', 'Потім випиши цілі числа, що потрапляють у проміжок (звертай увагу на квадратні й круглі дужки).'],
        solution: [`Нерівність виконується на $${tex(intervals)}$.`, `Цілі числа з цього проміжку: від $${strictLess ? a + 1 : a}$ до $${strictLess ? b - 1 : b}$ — їх $${count}$.`],
      }
    }),

    exercise('sign-at-point', 1, 'Знак виразу в точці', (rng) => {
      const roots = sortedRoots(rng, 3, -5, 5)
      const t = rng.pick([-8, -6, -4, -3, -2, -1, 0, 1, 2, 3, 4, 6, 8].filter((v) => !roots.includes(v)))
      const s = signAt(t, roots.map((r) => ({ r, m: 1 })), [], 1)
      return {
        prompt: `Який знак має вираз $${prodTex(roots.map((r) => ({ r, m: 1 })))}$ при $x = ${t}$?`,
        answer: choiceAnswer(rng, s > 0 ? 'додатний' : 'від’ємний', ['додатний', 'від’ємний', 'дорівнює нулю']),
        hints: ['Підстав значення $x$ у кожен множник і визнач знак кожного окремо.', 'Мінус на мінус дає плюс: порахуй, скільки від’ємних множників. Парна кількість — добуток додатний.'],
        solution: roots.map((r) => `$${t} - ${r < 0 ? `(${r})` : r} = ${t - r}$ — ${t - r > 0 ? 'додатний' : 'від’ємний'} множник`).concat([`Від’ємних множників: ${roots.filter((r) => t - r < 0).length}, тому добуток ${s > 0 ? 'додатний' : 'від’ємний'}.`]),
      }
    }),
  ],
})
