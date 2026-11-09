import type { Problem } from '@krok/core'
import { choiceAnswer, exercise, frac, linear, num, paren, poly, signed, topicFactory } from '../../lib'

const topic = topicFactory('algebra', 8)

/** Коефіцієнти a, b, c у вигляді рядка LaTeX: «x^{2} - 5x + 6». */
const quad = (a: number, b: number, c: number) => poly([a, b, c])

/** Рядок з обчисленням дискримінанта: D = (-5)^2 - 4·1·6 = 1. */
const dSolution = (a: number, b: number, c: number) => {
  const d = b * b - 4 * a * c
  return `$D = b^2 - 4ac = ${paren(b)}^2 - 4 \\cdot ${paren(a)} \\cdot ${paren(c)} = ${b * b} ${signed(-4 * a * c).trim()} = ${d}$`
}

/** Створює задачу «розв'яжи» з кроками для рівняння з цілими коренями або без. */
function solveProblem(a: number, b: number, c: number, prompt: string, extraSolution: string[] = []): Problem {
  const d = b * b - 4 * a * c
  const roots = d < 0 ? [] : d === 0 ? [-b / (2 * a)] : [(-b - Math.sqrt(d)) / (2 * a), (-b + Math.sqrt(d)) / (2 * a)]
  const sd = Math.sqrt(d)
  const rootLines =
    d < 0
      ? [`Оскільки $D < 0$, рівняння **не має коренів**.`]
      : d === 0
        ? [`$D = 0$, тому корінь один: $x = \\dfrac{-b}{2a} = \\dfrac{${-b}}{${2 * a}} = ${frac(-b, 2 * a)}$.`]
        : [
            `$D > 0$, тому два корені: $x = \\dfrac{-b \\pm \\sqrt{D}}{2a} = \\dfrac{${-b} \\pm ${sd}}{${2 * a}}$.`,
            `$x_1 = \\dfrac{${-b} - ${sd}}{${2 * a}} = ${frac(-b - sd, 2 * a)}$, $\\quad x_2 = \\dfrac{${-b} + ${sd}}{${2 * a}} = ${frac(-b + sd, 2 * a)}$.`,
          ]
  return {
    prompt,
    answer: { kind: 'numberSet', values: roots },
    answerTex: d < 0 ? '\\text{коренів немає}' : roots.map((r) => frac(Math.round(r * 2 * a), 2 * a)).join(';\\ '),
    inputHint: 'Корені введіть через «;». Якщо коренів немає — напишіть «немає».',
    hints: [
      `Спочатку випиши коефіцієнти $a$, $b$, $c$ — разом зі знаками. Якщо перед $x$ немає числа, коефіцієнт дорівнює $1$ (або $-1$).`,
      `Порахуй дискримінант за формулою $D = b^2 - 4ac$. Якщо $b$ від'ємне, бери його в дужки: $(-5)^2 = 25$.`,
      d < 0
        ? `Дискримінант від'ємний. Що це означає для кількості коренів?`
        : `Підстав $D$ у формулу $x = \\dfrac{-b \\pm \\sqrt{D}}{2a}$ і порахуй окремо «плюс» та «мінус».`,
    ],
    solution: [
      `Коефіцієнти: $a = ${a}$, $b = ${b}$, $c = ${c}$.`,
      dSolution(a, b, c),
      ...rootLines,
      ...extraSolution,
    ],
    steps: [
      {
        prompt: `Випиши коефіцієнти $a$, $b$, $c$ через «;».`,
        answer: { kind: 'tuple', values: [a, b, c] },
        hint: `Рівняння має вигляд $ax^2 + bx + c = 0$. Знак числа належить йому: у $x^2 - 5x + 6$ коефіцієнт $b = -5$.`,
        explanation: `$a = ${a}$, $b = ${b}$, $c = ${c}$.`,
      },
      {
        prompt: `Чому дорівнює дискримінант $D = b^2 - 4ac$?`,
        answer: { kind: 'number', value: d },
        hint: `Підставляй числа в дужках: $b^2 = ${paren(b)}^2$, $4ac = 4 \\cdot ${paren(a)} \\cdot ${paren(c)}$.`,
        explanation: dSolution(a, b, c),
      },
      {
        prompt: d < 0 ? `Скільки коренів має рівняння? (Введіть число.)` : `Знайди корені (через «;»).`,
        answer: d < 0 ? { kind: 'number', value: 0 } : { kind: 'numberSet', values: roots },
        hint: d < 0 ? `Корінь з від'ємного числа не існує.` : `Використай $x = \\dfrac{-b \\pm \\sqrt{D}}{2a}$.`,
        explanation: rootLines.join(' '),
      },
    ],
  }
}

export default topic('a8-3', {
  id: 'a8-quad-formula',
  title: 'Квадратне рівняння: дискримінант і формула коренів',
  summary:
    'Універсальний спосіб розв’язати будь-яке квадратне рівняння: порахувати дискримінант, за ним зрозуміти, скільки коренів, і знайти їх за формулою.',
  prereqs: ['a8-quad-incomplete'],
  estMinutes: 40,
  tags: ['рівняння', 'дискримінант'],

  lesson: [
    {
      title: 'Навіщо потрібна формула',
      blocks: [
        {
          type: 'intuition',
          md: 'Рівняння $x^2 = 9$ чи $x^2 - 4x = 0$ ти вже вмієш розв’язувати «на око»: витягнути корінь або винести $x$ за дужки. Але що робити з $x^2 - 5x + 6 = 0$, де є **всі три** доданки? Підбирати наосліп — довго і ненадійно (а іноді корені взагалі некрасиві). Тому математики придумали **одну формулу**, яка працює для будь-якого квадратного рівняння. Твоя робота — акуратно підставити числа.',
        },
        {
          type: 'tip',
          md: 'Формула — не магія: вона виходить із «добудови до повного квадрата», яку ти вже бачив у формулі $(a+b)^2$. Нижче в уроці є, звідки вона береться, але користуватись нею можна й не знаючи виведення.',
        },
      ],
    },
    {
      title: 'Що таке квадратне рівняння',
      blocks: [
        {
          type: 'definition',
          term: 'Квадратне рівняння',
          md: 'Рівняння вигляду $$ax^2 + bx + c = 0,$$ де $x$ — змінна, $a$, $b$, $c$ — числа, причому $a \\ne 0$. Число $a$ — перший коефіцієнт, $b$ — другий, $c$ — вільний член.',
        },
        {
          type: 'text',
          md: 'Чому $a \\ne 0$? Якби $a = 0$, доданок $ax^2$ зник би і лишилось би $bx + c = 0$ — звичайне лінійне рівняння. Саме «квадрат» робить рівняння квадратним.',
        },
        {
          type: 'check',
          question: 'Визнач $a$, $b$, $c$ у рівнянні $x^2 - 5x + 6 = 0$.',
          answer: '$a = 1,\\ b = -5,\\ c = 6$',
          explain: 'Перед $x^2$ нічого не написано — отже, $a = 1$. Мінус належить числу 5, тому $b = -5$ (а не $5$).',
        },
        {
          type: 'warning',
          md: 'Перед тим як шукати $a$, $b$, $c$, **приведи рівняння до вигляду** $ax^2 + bx + c = 0$: все в одну частину, справа — нуль. Наприклад, у $x^2 + 3x = 2x + 6$ спершу перенеси: $x^2 + x - 6 = 0$. Тільки тепер $a = 1$, $b = 1$, $c = -6$.',
        },
      ],
    },
    {
      title: 'Дискримінант — «лічильник коренів»',
      blocks: [
        {
          type: 'definition',
          term: 'Дискримінант',
          md: 'Число $$D = b^2 - 4ac.$$ Воно «передбачає» кількість коренів ще до того, як ми їх знайшли.',
        },
        {
          type: 'rule',
          title: 'Скільки коренів?',
          md: '- $D > 0$ — **два** різні корені;\n- $D = 0$ — **один** корінь (його ще називають подвійним);\n- $D < 0$ — **коренів немає**.',
        },
        {
          type: 'intuition',
          md: 'Корені рівняння $ax^2 + bx + c = 0$ — це точки, де парабола $y = ax^2 + bx + c$ перетинає вісь $Ox$. Парабола може перетнути вісь у двох точках, торкнутись у одній або взагалі пройти осторонь. Дискримінант говорить саме про це:',
        },
        {
          type: 'figure',
          figure: {
            view: [-3, -2, 5, 7],
            width: 300,
            axes: { grid: true, ticks: true },
            items: [
              { t: 'plot', expr: 'x^2 - 2x - 3', color: 'ink' },
              { t: 'dot', at: [-1, 0], color: 'red' },
              { t: 'dot', at: [3, 0], color: 'red' },
              { t: 'text', at: [0.2, 6], text: 'D > 0: два корені', color: 'ink' },
            ],
            caption: '$x^2 - 2x - 3 = 0$: парабола перетинає вісь у двох точках ($x=-1$ і $x=3$).',
          },
        },
        {
          type: 'figure',
          figure: {
            view: [-3, -2, 5, 7],
            width: 300,
            axes: { grid: true, ticks: true },
            items: [
              { t: 'plot', expr: 'x^2 - 2x + 1', color: 'ink' },
              { t: 'dot', at: [1, 0], color: 'red' },
              { t: 'text', at: [0.2, 6], text: 'D = 0: один корінь', color: 'ink' },
            ],
            caption: '$x^2 - 2x + 1 = 0$: парабола лише торкається осі в точці $x = 1$.',
          },
        },
        {
          type: 'figure',
          figure: {
            view: [-3, -2, 5, 7],
            width: 300,
            axes: { grid: true, ticks: true },
            items: [
              { t: 'plot', expr: 'x^2 - 2x + 3', color: 'ink' },
              { t: 'text', at: [0.2, 6], text: 'D < 0: коренів немає', color: 'ink' },
            ],
            caption: '$x^2 - 2x + 3 = 0$: парабола зависла над віссю — перетинів немає.',
          },
        },
      ],
    },
    {
      title: 'Формула коренів',
      blocks: [
        {
          type: 'rule',
          title: 'Корені квадратного рівняння',
          md: 'Якщо $D \\ge 0$, то $$x = \\frac{-b \\pm \\sqrt{D}}{2a}.$$ Знак «$\\pm$» означає два значення: $x_1 = \\dfrac{-b - \\sqrt{D}}{2a}$ та $x_2 = \\dfrac{-b + \\sqrt{D}}{2a}$. Якщо $D = 0$, обидва збігаються: $x = \\dfrac{-b}{2a}$.',
        },
        {
          type: 'algorithm',
          title: 'Як розв’язати квадратне рівняння',
          steps: [
            'Приведи рівняння до вигляду $ax^2 + bx + c = 0$ (все в одну частину, справа $0$).',
            'Випиши $a$, $b$, $c$ **разом зі знаками**.',
            'Порахуй $D = b^2 - 4ac$. Від’ємне $b$ бери в дужки.',
            'Порівняй $D$ з нулем: скільки буде коренів?',
            'Якщо $D \\ge 0$ — підстав у формулу $x = \\dfrac{-b \\pm \\sqrt{D}}{2a}$ і порахуй обидва корені.',
            'Перевір підстановкою хоча б один корінь у вихідне рівняння.',
          ],
        },
        {
          type: 'text',
          md: '**Звідки формула?** Помножимо $ax^2 + bx + c = 0$ на $4a$ і виділимо повний квадрат: $4a^2x^2 + 4abx + 4ac = 0$, тобто $(2ax + b)^2 - b^2 + 4ac = 0$, звідки $(2ax + b)^2 = b^2 - 4ac = D$. Тепер це вже «неповне»: $2ax + b = \\pm\\sqrt{D}$, і виразити $x$ — справа техніки.',
        },
        {
          type: 'warning',
          md: 'Два найпопулярніші промахи: **(1)** знак у $-b$: якщо $b = -5$, то $-b = 5$; **(2)** ділити треба **весь** чисельник на $2a$, а не лише корінь.',
        },
      ],
    },
  ],

  examples: [
    {
      title: 'Два корені',
      problem: 'Розв’яжіть рівняння $2x^2 - 7x + 3 = 0$.',
      steps: [
        { think: 'Рівняння вже у стандартному вигляді, справа нуль.', do: '$a = 2,\\ b = -7,\\ c = 3$.' },
        { think: '$b$ від’ємне — беру в дужки, щоб не помилитись у знаку.', do: '$D = (-7)^2 - 4 \\cdot 2 \\cdot 3 = 49 - 24 = 25$.' },
        { think: '$D > 0$ — буде два корені. $\\sqrt{25} = 5$.', do: '$x = \\dfrac{-(-7) \\pm 5}{2 \\cdot 2} = \\dfrac{7 \\pm 5}{4}$.' },
        { do: '$x_1 = \\dfrac{7 - 5}{4} = \\dfrac12$, $\\quad x_2 = \\dfrac{7 + 5}{4} = 3$.' },
        { think: 'Перевіряю $x = 3$: $2 \\cdot 9 - 21 + 3 = 0$. ✓', do: 'Перевірка сходиться.' },
      ],
      answer: '$x_1 = \\dfrac12,\\ x_2 = 3$',
    },
    {
      title: 'Спершу привести до стандартного вигляду',
      problem: 'Розв’яжіть рівняння $x^2 + 3x = 2x + 6$.',
      steps: [
        { think: 'Справа не нуль! Переношу все вліво, не забуваючи міняти знаки.', do: '$x^2 + 3x - 2x - 6 = 0 \\ \\Rightarrow\\ x^2 + x - 6 = 0$.' },
        { do: '$a = 1,\\ b = 1,\\ c = -6$.' },
        { do: '$D = 1^2 - 4 \\cdot 1 \\cdot (-6) = 1 + 24 = 25$.' },
        { think: '$-4ac$ при від’ємному $c$ дає **плюс** — поширена пастка.', do: '$x = \\dfrac{-1 \\pm 5}{2}$: $\\ x_1 = -3$, $\\ x_2 = 2$.' },
      ],
      answer: '$x_1 = -3,\\ x_2 = 2$',
    },
    {
      title: 'Коли коренів немає',
      problem: 'Скільки коренів має рівняння $3x^2 - 2x + 5 = 0$?',
      steps: [
        { do: '$a = 3,\\ b = -2,\\ c = 5$.' },
        { do: '$D = (-2)^2 - 4 \\cdot 3 \\cdot 5 = 4 - 60 = -56$.' },
        { think: '$D < 0$ — корінь із від’ємного числа в дійсних числах не існує. Шукати корені не треба.', do: 'Коренів немає.' },
      ],
      answer: 'Коренів немає.',
    },
    ...[
      [1, -8, 15], [1, 6, 5], [2, 5, -3], [3, -10, 3], [1, -2, -8],
      [2, -3, -2], [1, 4, 1], [4, -4, -3], [1, -9, 14], [2, 7, 3],
      [1, 10, 21], [3, 2, -8], [1, -1, -12], [2, -9, 4], [1, 2, -15],
      [1, -12, 36], [2, 3, -9], [1, 5, 4], [3, -7, 2], [1, -4, -5],
    ].map(([a, b, c], i) => {
      const d = b * b - 4 * a * c
      const roots = d < 0 ? [] : d === 0 ? [-b / (2 * a)] : [(-b - Math.sqrt(d)) / (2 * a), (-b + Math.sqrt(d)) / (2 * a)]
      return {
        title: `Тренувальний приклад ${i + 4}: ${d > 0 ? 'два корені' : d === 0 ? 'подвійний корінь' : 'без дійсних коренів'}`,
        problem: `Розв’яжіть рівняння $${quad(a, b, c)} = 0$.`,
        steps: [
          { think: 'Спочатку визначаю коефіцієнти зі знаками.', do: `$a = ${a},\\ b = ${b},\\ c = ${c}$.` },
          { think: 'Дискримінант показує кількість коренів.', do: dSolution(a, b, c) },
          { think: d < 0 ? 'Дискримінант від’ємний, тому в дійсних числах коренів немає.' : 'Підставляю дискримінант у формулу коренів і рахую окремо два знаки.', do: d < 0 ? 'Коренів немає.' : `Корені: ${roots.join('; ')}.` },
        ],
        answer: d < 0 ? 'Коренів немає.' : `Корені: ${roots.join('; ')}.`,
      }
    }),
  ],

  formulas: [
    { title: 'Дискримінант', tex: 'D = b^2 - 4ac' },
    { title: 'Корені при $D > 0$', tex: 'x_{1,2} = \\dfrac{-b \\pm \\sqrt{D}}{2a}' },
    { title: 'Корінь при $D = 0$', tex: 'x = -\\dfrac{b}{2a}' },
  ],

  mistakes: [
    { wrong: 'У $x^2 - 5x + 6 = 0$ беруть $b = 5$.', why: 'Знак стоїть перед числом і належить йому.', right: '$b = -5$, тому $-b = 5$.' },
    { wrong: '$D = b^2 - 4ac$ при $c = -6$: $1 - 4 \\cdot 1 \\cdot 6 = -23$.', why: 'Забули, що $c$ від’ємне: $-4ac = -4 \\cdot 1 \\cdot (-6) = +24$.', right: '$D = 1 + 24 = 25$.' },
    { wrong: '$x = -b \\pm \\dfrac{\\sqrt{D}}{2a}$.', why: 'Дріб — це весь чисельник $-b \\pm \\sqrt{D}$ над $2a$.', right: '$x = \\dfrac{-b \\pm \\sqrt{D}}{2a}$.' },
    { wrong: 'Рівняння $x^2 + 3x = 2x + 6$ розв’язують, одразу беручи $c = 6$.', why: 'Рівняння не приведене до вигляду «= 0».', right: 'Спершу $x^2 + x - 6 = 0$, і тільки тоді $c = -6$.' },
  ],

  exercises: [
    exercise('discriminant', 1, 'Обчислити дискримінант', (rng) => {
      const a = rng.pick([1, 1, 2, 3, -1, -2])
      const b = rng.int(-9, 9)
      const c = rng.nonZero(-8, 8)
      const d = b * b - 4 * a * c
      return {
        prompt: `Знайдіть дискримінант рівняння $${quad(a, b, c)} = 0$.`,
        answer: { kind: 'number', value: d },
        answerTex: String(d),
        hints: [
          `Випиши $a$, $b$, $c$ зі знаками: $a = ${a}$, $b = ${b}$, $c = ${c}$.`,
          `Формула: $D = b^2 - 4ac$. Підстав числа, від'ємні бери в дужки.`,
        ],
        solution: [`$a = ${a},\\ b = ${b},\\ c = ${c}$.`, dSolution(a, b, c)],
        steps: [
          { prompt: `Випиши $a$, $b$, $c$ через «;».`, answer: { kind: 'tuple', values: [a, b, c] }, explanation: `$a = ${a}$, $b = ${b}$, $c = ${c}$.` },
          { prompt: `Тепер порахуй $D = b^2 - 4ac$.`, answer: { kind: 'number', value: d }, explanation: dSolution(a, b, c) },
        ],
      }
    }),

    exercise('number-of-roots', 1, 'Кількість коренів за дискримінантом', (rng) => {
      const kind = rng.pick(['two', 'one', 'none'] as const)
      let a = rng.pick([1, 2, 3])
      let b: number
      let c: number
      if (kind === 'one') {
        const k = rng.nonZero(-4, 4)
        b = 2 * a * k
        c = a * k * k
      } else if (kind === 'two') {
        b = rng.int(-6, 6)
        c = rng.int(-5, 0) // ac ≤ 0 ⇒ D > 0 (якщо c = 0 і b ≠ 0 — теж два корені)
        if (b === 0 && c === 0) c = -2
      } else {
        b = rng.int(-4, 4)
        c = Math.ceil((b * b) / (4 * a)) + rng.int(1, 3)
      }
      const d = b * b - 4 * a * c
      const text = d > 0 ? 'два корені' : d === 0 ? 'один корінь' : 'коренів немає'
      return {
        prompt: `Скільки коренів має рівняння $${quad(a, b, c)} = 0$?`,
        answer: choiceAnswer(rng, text, ['два корені', 'один корінь', 'коренів немає']),
        hints: [`Кількість коренів залежить від знака дискримінанта $D = b^2 - 4ac$.`, `$D > 0$ — два корені; $D = 0$ — один; $D < 0$ — жодного.`],
        solution: [dSolution(a, b, c), d > 0 ? '$D > 0$ — два корені.' : d === 0 ? '$D = 0$ — один корінь.' : '$D < 0$ — коренів немає.'],
      }
    }),

    exercise('solve-a1', 1, 'Розв’язати рівняння з a = 1', (rng) => {
      const [r1, r2] = rng.ints(2, -7, 7, { distinct: true })
      const b = -(r1 + r2)
      const c = r1 * r2
      return solveProblem(1, b, c, `Розв’яжіть рівняння $${quad(1, b, c)} = 0$.`)
    }),

    exercise('solve-a-not-1', 2, 'Розв’язати рівняння з a ≠ 1', (rng) => {
      const a = rng.pick([2, 3, 4, -1, -2])
      const [r1, r2] = rng.ints(2, -4, 4, { distinct: true })
      // (x - r1)(x - r2) помножено на a
      return solveProblem(a, -a * (r1 + r2), a * r1 * r2, `Розв’яжіть рівняння $${quad(a, -a * (r1 + r2), a * r1 * r2)} = 0$.`)
    }),

    exercise('solve-fractional-roots', 2, 'Дробові корені', (rng) => {
      // (2x - m)(x - n) = 2x^2 - (m + 2n)x + mn, корені m/2 та n
      const m = rng.pick([1, 3, 5, -1, -3, -5])
      const n = rng.int(-3, 3)
      return solveProblem(2, -(m + 2 * n), m * n, `Розв’яжіть рівняння $${quad(2, -(m + 2 * n), m * n)} = 0$.`)
    }),

    exercise('solve-one-root', 2, 'Рівняння з одним коренем', (rng) => {
      const p = rng.pick([1, 2, 3])
      const q = rng.nonZero(-5, 5)
      // (px + q)^2 = p^2 x^2 + 2pq x + q^2
      return solveProblem(p * p, 2 * p * q, q * q, `Розв’яжіть рівняння $${quad(p * p, 2 * p * q, q * q)} = 0$.`)
    }),

    exercise('solve-no-roots', 2, 'Рівняння без коренів', (rng) => {
      const a = rng.pick([1, 2, 3])
      const b = rng.int(-5, 5)
      const c = Math.ceil((b * b) / (4 * a)) + rng.int(1, 4)
      return solveProblem(a, b, c, `Розв’яжіть рівняння $${quad(a, b, c)} = 0$.`)
    }),

    exercise('standard-form', 2, 'Спершу привести до стандартного вигляду', (rng) => {
      const [r1, r2] = rng.ints(2, -6, 6, { distinct: true })
      const b = -(r1 + r2)
      const c = r1 * r2
      const p = rng.int(-5, 5)
      // x^2 + p x = q x + s  ⇒  x^2 + (p - q) x - s = 0 ;  хочемо p - q = b,  -s = c
      const q = p - b
      const s = -c
      const left = poly([1, p, 0])
      const right = poly([q, s])
      return solveProblem(1, b, c, `Розв’яжіть рівняння $${left} = ${right}$.`, [`(Спершу перенесли все вліво: $${quad(1, b, c)} = 0$.)`])
    }),

    exercise('irrational-roots', 3, 'Ірраціональні корені', (rng) => {
      const b = 2 * rng.nonZero(-4, 4)
      const m = rng.pick([2, 3, 5, 6, 7, 10])
      // x^2 + bx + c = 0, D/4 = (b/2)^2 - c = m  ⇒  c = (b/2)^2 - m
      const c = (b / 2) ** 2 - m
      const d = b * b - 4 * c
      const k = -b / 2
      const roots = [k - Math.sqrt(m), k + Math.sqrt(m)]
      return {
        prompt: `Розв’яжіть рівняння $${quad(1, b, c)} = 0$. Відповідь запишіть точно (з коренем).`,
        answer: { kind: 'numberSet', values: roots },
        answerTex: `${k}\\pm\\sqrt{${m}}`,
        inputHint: 'Приклад запису: -1+√3; -1-√3',
        hints: [
          `Порахуй $D = b^2 - 4ac$. Тут воно не буде повним квадратом — і це нормально.`,
          `Корінь із $D$ залиш у відповіді: $\\sqrt{${d}} = 2\\sqrt{${m}}$ (виноси множник із-під кореня).`,
        ],
        solution: [
          dSolution(1, b, c),
          `$\\sqrt{D} = \\sqrt{${d}} = 2\\sqrt{${m}}$.`,
          `$x = \\dfrac{${-b} \\pm 2\\sqrt{${m}}}{2} = ${k} \\pm \\sqrt{${m}}$.`,
        ],
      }
    }),

    exercise('parameter', 3, 'Параметр: один корінь', (rng) => {
      const variant = rng.pick(['c', 'b'] as const)
      if (variant === 'c') {
        const half = rng.nonZero(-5, 5)
        const b = 2 * half
        return {
          prompt: `При якому значенні $p$ рівняння $x^2 ${signed(b).trim()}x + p = 0$ має рівно один корінь?`,
          answer: { kind: 'number', value: half * half },
          hints: [`Один корінь — це $D = 0$.`, `Запиши $D$ через $p$: $D = ${b}^2 - 4p$. Прирівняй до нуля.`],
          solution: [`$D = ${b}^2 - 4 \\cdot 1 \\cdot p = ${b * b} - 4p$.`, `Один корінь, коли $D = 0$: $${b * b} - 4p = 0$, звідки $p = ${half * half}$.`],
        }
      }
      const k = rng.int(2, 6)
      return {
        prompt: `При яких значеннях $p$ рівняння $x^2 + px + ${k * k} = 0$ має рівно один корінь? Запишіть усі значення через «;».`,
        answer: { kind: 'numberSet', values: [2 * k, -2 * k] },
        inputHint: 'Усі значення через «;»',
        hints: [`Один корінь — це $D = 0$.`, `$D = p^2 - 4 \\cdot ${k * k} = p^2 - ${4 * k * k}$. Розв'яжи $p^2 = ${4 * k * k}$ — там два розв'язки!`],
        solution: [`$D = p^2 - 4 \\cdot 1 \\cdot ${k * k} = p^2 - ${4 * k * k}$.`, `$D = 0 \\Rightarrow p^2 = ${4 * k * k} \\Rightarrow p = ${2 * k}$ або $p = ${-2 * k}$.`],
      }
    }),

    exercise('word-rectangle', 2, 'Задача на площу прямокутника', (rng) => {
      const w = rng.int(3, 12)
      const m = rng.int(1, 7)
      const area = w * (w + m)
      return {
        prompt: `Довжина прямокутника на ${m} см більша за ширину, а площа дорівнює ${area} см². Знайдіть ширину прямокутника (у см).`,
        answer: { kind: 'number', value: w },
        hints: [
          `Нехай ширина $x$ см, тоді довжина $x + ${m}$ см. Площа = довжина · ширина.`,
          `Склади рівняння $x(x + ${m}) = ${area}$ і приведи до вигляду $ax^2 + bx + c = 0$.`,
          `Від'ємний корінь для ширини не підходить — відкинь його.`,
        ],
        solution: [
          `Нехай ширина $x$ см, довжина $x + ${m}$ см. Тоді $x(x + ${m}) = ${area}$.`,
          `$x^2 + ${m}x - ${area} = 0$, $\\ D = ${m * m} + ${4 * area} = ${m * m + 4 * area} = ${2 * w + m}^2$.`,
          `$x = \\dfrac{-${m} \\pm ${2 * w + m}}{2}$: $\\ x_1 = ${w}$, $\\ x_2 = ${-(w + m)}$.`,
          `Ширина не може бути від'ємною, тому $x = ${w}$.`,
        ],
        steps: [
          { prompt: `Нехай ширина $x$ см. Склади рівняння й приведи до вигляду $x^2 + bx + c = 0$. Введи $b$ і $c$ через «;».`, answer: { kind: 'tuple', values: [m, -area] }, hint: `$x(x + ${m}) = ${area}$ → розкрий дужки і перенеси ${area} вліво.`, explanation: `$x^2 + ${m}x - ${area} = 0$.` },
          { prompt: `Розв'яжи рівняння, введи обидва корені через «;».`, answer: { kind: 'numberSet', values: [w, -(w + m)] }, explanation: `$x_1 = ${w}$, $x_2 = ${-(w + m)}$.` },
          { prompt: `Який корінь підходить для ширини?`, answer: { kind: 'number', value: w }, explanation: `Додатний: ширина $${w}$ см.` },
        ],
      }
    }),
  ],
})
