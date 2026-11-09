import type { Figure, FigureItem } from '@krok/core'
import { choiceAnswer, exercise, gcd, polar, topicFactory } from '../../lib'

const topic = topicFactory('algebra', 10)

/** LaTeX для (n/d)·π у скороченому вигляді. */
function piTex(n: number, d: number): string {
  if (n === 0) return '0'
  const g = gcd(n, d)
  let a = n / g
  const b = d / g
  const sign = a < 0 ? '-' : ''
  a = Math.abs(a)
  if (b === 1) return `${sign}${a === 1 ? '' : a}\\pi`
  return `${sign}\\dfrac{${a === 1 ? '' : a}\\pi}{${b}}`
}
/** Те саме простим текстом для варіантів відповіді: 5π/6. */
function piText(n: number, d: number): string {
  return `$${piTex(n, d)}$`
}

/** Одиничне коло з позначеними кутами (у градусах). */
function unitCircle(angles: number[], mark?: { deg: number; label: string }): Figure {
  const items: FigureItem[] = [{ t: 'circle', c: [0, 0], r: 1 }]
  for (const a of angles) {
    const p = polar(0, 0, 1, a)
    const q = polar(0, 0, 1.3, a)
    items.push({ t: 'dot', at: p, color: 'orange' })
    const g = gcd(a, 180)
    const label = a === 0 ? '0' : `${a / g === 1 ? '' : a / g}π${180 / g === 1 ? '' : '/' + 180 / g}`
    items.push({ t: 'text', at: [q[0] - 0.12 - label.length * 0.025, q[1] - 0.04], text: `${label}`, size: 12 })
  }
  if (mark) {
    items.push({ t: 'seg', a: [0, 0], b: polar(0, 0, 1, mark.deg), color: 'red' })
    items.push({ t: 'dot', at: polar(0, 0, 1, mark.deg), color: 'red' })
    items.push({ t: 'angle', at: [0, 0], from: [1, 0], to: polar(0, 0, 1, mark.deg), label: mark.label, r: 0.3, color: 'red' })
  }
  return { view: [-1.6, -1.5, 1.6, 1.5], width: 340, axes: { grid: false, ticks: false }, items }
}

const DEG_SET = [15, 30, 45, 60, 75, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]
const PI_FRACS: [number, number][] = [[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6], [7, 6], [5, 4], [4, 3], [3, 2], [5, 3], [7, 4], [11, 6]]

export default topic('a10-3', {
  id: 'a10-radians',
  title: 'Радіанна міра кута. Одиничне коло',
  summary: 'Новий спосіб вимірювати кути — у радіанах: чому 180° = π, як переходити між градусами й радіанами та як кути «живуть» на одиничному колі.',
  prereqs: [],
  estMinutes: 40,
  tags: ['тригонометрія', 'радіани'],

  lesson: [
    {
      title: 'Навіщо ще одна міра кута',
      blocks: [
        {
          type: 'intuition',
          md: 'Градус — зручна, але **випадкова** одиниця: коло розбили на 360 частин, бо так колись було зручно рахувати. Математиці потрібна міра, пов’язана з самим колом. Візьмемо коло радіуса $R$ і відкладемо на ньому дугу **такої самої довжини $R$**. Центральний кут, що спирається на цю дугу, назвали **одним радіаном**. Не потрібні ніякі «360» — кут вимірюється відношенням довжини дуги до радіуса.',
        },
        {
          type: 'definition',
          term: 'Радіан',
          md: 'Кут, що стягує дугу, довжина якої дорівнює радіусу кола. Радіанна міра кута $\\alpha$ — це число $\\alpha = \\dfrac{l}{R}$, де $l$ — довжина дуги, $R$ — радіус.',
        },
        {
          type: 'text',
          md: 'Довжина всього кола $2\\pi R$, тож повний оберт — це $\\dfrac{2\\pi R}{R} = 2\\pi$ радіанів. Отже, $360^\\circ = 2\\pi$ рад, а розгорнутий кут $180^\\circ = \\pi$ рад (≈ 3,14). Один радіан приблизно $57{,}3^\\circ$.',
        },
        {
          type: 'rule',
          title: 'Перехід між мірами',
          md: '$$\\alpha_{\\text{рад}} = \\alpha^\\circ \\cdot \\frac{\\pi}{180}, \\qquad \\alpha^\\circ = \\alpha_{\\text{рад}} \\cdot \\frac{180}{\\pi}.$$ Практично: «$\\pi$ — це $180^\\circ$». Тоді $\\dfrac{\\pi}{6}$ — це $180^\\circ : 6 = 30^\\circ$, а $\\dfrac{5\\pi}{4}$ — це $5 \\cdot 45^\\circ = 225^\\circ$.',
        },
        {
          type: 'tip',
          md: 'Слово «рад» зазвичай не пишуть: якщо поруч немає знака градуса, кут у радіанах. $\\sin 2$ означає синус кута у $2$ радіани, а не $2^\\circ$.',
        },
      ],
    },
    {
      title: 'Одиничне коло',
      blocks: [
        {
          type: 'definition',
          term: 'Одиничне коло',
          md: 'Коло радіуса $1$ із центром у початку координат. Кут відкладають від додатного напрямку осі $Ox$: **проти годинникової стрілки — додатний** кут, за стрілкою — від’ємний. Кінець повороту — точка на колі.',
        },
        { type: 'figure', figure: { ...unitCircle([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]), caption: 'Головні кути на одиничному колі (у радіанах). Повний оберт — $2\\pi$.' } },
        {
          type: 'rule',
          title: 'Кути, що відрізняються на оберт',
          md: 'Повороти на $\\alpha$ і на $\\alpha + 2\\pi k$ ($k$ — ціле) закінчуються в **одній точці** кола. Тому $\\dfrac{13\\pi}{6}$ — це те саме положення, що й $\\dfrac{\\pi}{6}$: $\\dfrac{13\\pi}{6} - 2\\pi = \\dfrac{\\pi}{6}$.',
        },
        {
          type: 'algorithm',
          title: 'Як визначити чверть для кута в радіанах',
          steps: [
            'Відніми (або додай) $2\\pi$ стільки разів, щоб потрапити в проміжок $[0;\\, 2\\pi)$.',
            'Порівняй із $\\dfrac{\\pi}{2}$, $\\pi$, $\\dfrac{3\\pi}{2}$: чверті I — $(0; \\tfrac{\\pi}{2})$, II — $(\\tfrac{\\pi}{2}; \\pi)$, III — $(\\pi; \\tfrac{3\\pi}{2})$, IV — $(\\tfrac{3\\pi}{2}; 2\\pi)$.',
            'Якщо кут рівно $0, \\tfrac{\\pi}{2}, \\pi, \\tfrac{3\\pi}{2}$ — точка лежить на осі, а не в чверті.',
          ],
        },
        {
          type: 'check',
          question: 'У якій чверті закінчується поворот на кут $-\\dfrac{\\pi}{3}$?',
          answer: 'У IV чверті.',
          explain: 'Від’ємний кут — поворот за стрілкою. $-\\dfrac{\\pi}{3} + 2\\pi = \\dfrac{5\\pi}{3}$, а це між $\\dfrac{3\\pi}{2}$ та $2\\pi$.',
        },
      ],
    },
    {
      title: 'Довжина дуги і площа сектора',
      blocks: [
        {
          type: 'rule',
          title: 'Формули для кута в радіанах',
          md: 'Довжина дуги: $l = \\alpha R$. Площа сектора: $S = \\dfrac{\\alpha R^2}{2}$. (Для кута в градусах були б множники $\\tfrac{\\pi}{180}$ — у радіанах формули простіші, у цьому і сенс.)',
        },
      ],
    },
  ],

  examples: [
    {
      title: 'Градуси → радіани',
      problem: 'Виразіть у радіанах: $a)\\ 150^\\circ$; $b)\\ 225^\\circ$.',
      steps: [
        { think: 'Множимо на $\\dfrac{\\pi}{180}$ і скорочуємо дріб.', do: '$150^\\circ = \\dfrac{150\\pi}{180} = \\dfrac{5\\pi}{6}$.' },
        { do: '$225^\\circ = \\dfrac{225\\pi}{180} = \\dfrac{5\\pi}{4}$ (скоротили на $45$).' },
      ],
      answer: '$\\dfrac{5\\pi}{6}$ та $\\dfrac{5\\pi}{4}$',
    },
    {
      title: 'Радіани → градуси',
      problem: 'Виразіть у градусах: $\\dfrac{7\\pi}{12}$.',
      steps: [
        { think: 'Замінюю $\\pi$ на $180^\\circ$.', do: '$\\dfrac{7 \\cdot 180^\\circ}{12} = 7 \\cdot 15^\\circ = 105^\\circ$.' },
      ],
      answer: '$105^\\circ$',
    },
    {
      title: 'Чверть кута більше оберту',
      problem: 'У якій чверті закінчується поворот на кут $\\dfrac{19\\pi}{6}$?',
      steps: [
        { think: 'Спершу зменшу кут на повні оберти ($2\\pi = \\dfrac{12\\pi}{6}$).', do: '$\\dfrac{19\\pi}{6} - \\dfrac{12\\pi}{6} = \\dfrac{7\\pi}{6}$.' },
        { think: '$\\pi = \\dfrac{6\\pi}{6}$, $\\dfrac{3\\pi}{2} = \\dfrac{9\\pi}{6}$: наш кут між ними.', do: '$\\pi < \\dfrac{7\\pi}{6} < \\dfrac{3\\pi}{2}$ — III чверть.' },
      ],
      answer: 'III чверть.',
    },
    {
      title: 'Дуга кола',
      problem: 'Радіус кола $6$ см, центральний кут $\\dfrac{5\\pi}{3}$. Знайдіть довжину дуги.',
      steps: [
        { think: 'Кут уже в радіанах — застосовую $l = \\alpha R$.', do: '$l = \\dfrac{5\\pi}{3} \\cdot 6 = 10\\pi$ (см).' },
      ],
      answer: '$10\\pi$ см',
    },
  ],

  formulas: [
    { title: 'Градуси → радіани', tex: '\\alpha_{\\text{рад}} = \\alpha^\\circ \\cdot \\dfrac{\\pi}{180}' },
    { title: 'Радіани → градуси', tex: '\\alpha^\\circ = \\alpha_{\\text{рад}} \\cdot \\dfrac{180}{\\pi}' },
    { title: 'Повний оберт', tex: '360^\\circ = 2\\pi \\text{ рад}' },
    { title: 'Довжина дуги', tex: 'l = \\alpha R' },
    { title: 'Площа сектора', tex: 'S = \\dfrac{\\alpha R^2}{2}' },
    { title: 'Той самий кінець повороту', tex: '\\alpha \\text{ і } \\alpha + 2\\pi k' },
  ],

  mistakes: [
    { wrong: '$\\sin 30$ — це синус $30^\\circ$.', why: 'Без знака градуса аргумент у радіанах.', right: '$\\sin 30^\\circ$ і $\\sin 30$ — різні числа.' },
    { wrong: '$90^\\circ = \\pi$ рад.', why: '$\\pi$ — це $180^\\circ$, а не $90^\\circ$.', right: '$90^\\circ = \\dfrac{\\pi}{2}$' },
    { wrong: 'Від’ємний кут $-\\dfrac{\\pi}{4}$ лежить у II чверті.', why: 'Від’ємний кут відкладають за годинниковою стрілкою.', right: 'Це IV чверть (еквівалентно $\\dfrac{7\\pi}{4}$).' },
    { wrong: 'При $\\alpha$ у градусах $l = \\alpha R$.', why: 'Формула $l = \\alpha R$ працює лише для радіанів.', right: '$l = \\dfrac{\\pi R \\alpha^\\circ}{180}$' },
  ],

  exercises: [
    exercise('deg-to-rad', 1, 'Градуси → радіани', (rng) => {
      const d = rng.pick(DEG_SET)
      const g = gcd(d, 180)
      return {
        prompt: `Виразіть у радіанах кут $${d}^\\circ$. (Відповідь можна ввести як «${d / g === 1 ? '' : d / g}π/${180 / g}» або числом.)`,
        answer: { kind: 'number', value: (d * Math.PI) / 180 },
        answerTex: piTex(d, 180),
        hints: ['Пам’ятай: $180^\\circ = \\pi$. Тоді $1^\\circ = \\dfrac{\\pi}{180}$.', `Помнож $${d}$ на $\\dfrac{\\pi}{180}$ і скороти дріб.`],
        solution: [`$${d}^\\circ = ${d} \\cdot \\dfrac{\\pi}{180} = ${piTex(d, 180)}$.`],
        steps: [
          { prompt: `Скільки градусів у $\\pi$ радіанів?`, answer: { kind: 'number', value: 180 }, explanation: '$\\pi$ рад $= 180^\\circ$.' },
          { prompt: `Яку частину від $180^\\circ$ складає $${d}^\\circ$? Запиши дріб, напр. «1/6».`, answer: { kind: 'number', value: d / 180 }, hint: `Скороти $\\dfrac{${d}}{180}$.`, explanation: `$\\dfrac{${d}}{180} = ${g === d ? '' : ''}\\dfrac{${d / g}}{${180 / g}}$.` },
        ],
        inputHint: 'Можна писати: 5π/6, або число 2,618…',
      }
    }),

    exercise('rad-to-deg', 1, 'Радіани → градуси', (rng) => {
      const [n, d] = rng.pick(PI_FRACS)
      const deg = (n * 180) / d
      return {
        prompt: `Виразіть у градусах кут $${piTex(n, d)}$ рад.`,
        answer: { kind: 'number', value: deg },
        answerTex: `${deg}^\\circ`,
        hints: ['Замінюй $\\pi$ на $180^\\circ$.', `Порахуй $\\dfrac{${n} \\cdot 180}{${d}}$.`],
        solution: [`$${piTex(n, d)} = \\dfrac{${n} \\cdot 180^\\circ}{${d}} = ${deg}^\\circ$.`],
      }
    }),

    exercise('quarter', 2, 'Визначити чверть', (rng) => {
      const k = rng.int(-2, 2)
      const d = rng.pick([3, 4, 6])
      let n = rng.int(1, 2 * d - 1)
      if ((n * 2) % d === 0) n += 1 // не потрапляти на осі
      const total = n + 2 * d * k
      const norm = ((total % (2 * d)) + 2 * d) % (2 * d)
      const q = (norm * 2) / d < 1 ? 1 : (norm * 2) / d < 2 ? 2 : (norm * 2) / d < 3 ? 3 : 4
      const names = ['I чверть', 'II чверть', 'III чверть', 'IV чверть']
      return {
        prompt: `У якій чверті закінчується поворот на кут $${piTex(total, d)}$?`,
        answer: choiceAnswer(rng, names[q - 1], names.filter((_, i) => i !== q - 1)),
        hints: ['Спершу додай або віднімай $2\\pi$, поки кут не потрапить у проміжок $[0;\\, 2\\pi)$.', 'Порівняй результат з $\\dfrac{\\pi}{2}$, $\\pi$, $\\dfrac{3\\pi}{2}$ (для зручності переведи у градуси).'],
        solution: [`Зведемо до $[0;\\, 2\\pi)$: $${piTex(total, d)} ${k === 0 ? '' : `${k > 0 ? '-' : '+'} ${Math.abs(k)} \\cdot 2\\pi`} = ${piTex(norm, d)}$.`, `У градусах це $${(norm * 180) / d}^\\circ$ — ${names[q - 1]}.`],
      }
    }),

    exercise('coterminal', 2, 'Звести кут до проміжку [0; 2π)', (rng) => {
      const d = rng.pick([3, 4, 6])
      const base = rng.pick(Array.from({ length: 2 * d - 1 }, (_, i) => i + 1))
      const k = rng.pick([-3, -2, -1, 1, 2, 3])
      const total = base + 2 * d * k
      return {
        prompt: `Знайдіть кут із проміжку $[0;\\, 2\\pi)$, який закінчується в тій самій точці одиничного кола, що й кут $${piTex(total, d)}$. Запишіть, напр., «5π/4».`,
        answer: { kind: 'number', value: (base * Math.PI) / d },
        answerTex: piTex(base, d),
        hints: ['Кути, що відрізняються на $2\\pi k$, дають одну й ту саму точку.', `$2\\pi = \\dfrac{${2 * d}\\pi}{${d}}$. Скільки разів треба додати або відняти?`],
        solution: [`$${piTex(total, d)} ${k > 0 ? '-' : '+'} ${Math.abs(k)} \\cdot 2\\pi = ${piTex(base, d)}$.`],
      }
    }),

    exercise('point-on-circle', 1, 'Кут за точкою на одиничному колі', (rng) => {
      const [n, d] = rng.pick<[number, number]>([[1, 6], [1, 4], [1, 3], [2, 3], [3, 4], [5, 6], [7, 6], [5, 4], [4, 3], [5, 3], [7, 4], [11, 6]])
      const deg = (n * 180) / d
      const options = PI_FRACS.filter(([a, b]) => (a * 180) / b !== deg)
      const wrong = rng.shuffle(options).slice(0, 3).map(([a, b]) => piText(a, b))
      return {
        prompt: `Яку радіанну міру має кут, позначений на малюнку червоним (відкладений від додатного напрямку осі $Ox$ проти годинникової стрілки до променя $O${rng.pick(['A', 'B', 'C', 'D', 'M', 'N', 'P', 'K'])}$)?`,
        figure: unitCircle([], { deg, label: '?' }),
        answer: choiceAnswer(rng, piText(n, d), wrong),
        hints: ['Спочатку оціни кут у градусах (транспортиром «на око»: це $30^\\circ$, $45^\\circ$, $60^\\circ$ чи кратне їм?).', 'Потім переведи градуси в радіани: $180^\\circ = \\pi$.'],
        solution: [`Кут дорівнює $${deg}^\\circ$ = $${piTex(n, d)}$ рад.`],
      }
    }),

    exercise('arc-length', 2, 'Довжина дуги', (rng) => {
      const [n, d] = rng.pick<[number, number]>([[1, 3], [1, 2], [2, 3], [3, 4], [5, 6], [3, 2], [5, 3]])
      const R = rng.pick([d, 2 * d, 3 * d, 6, 12])
      const l = (R * n) / d
      return {
        prompt: `Радіус кола дорівнює ${R} см, центральний кут — $${piTex(n, d)}$. Знайдіть довжину дуги (у см). Відповідь можна ввести як «${l % 1 === 0 ? l : ''}π» тощо.`,
        answer: { kind: 'number', value: l * Math.PI },
        answerTex: `${piTex(R * n, d)}`,
        hints: ['Кут уже в радіанах, тож довжина дуги дорівнює добутку кута на радіус: $l = \\alpha R$.', `Підстав: $l = ${piTex(n, d)} \\cdot ${R}$.`],
        solution: [`$l = \\alpha R = ${piTex(n, d)} \\cdot ${R} = ${piTex(R * n, d)}$ (см).`],
        inputHint: 'Можна ввести як 10π або як число',
      }
    }),

    exercise('sector-area', 3, 'Площа сектора', (rng) => {
      const [n, d] = rng.pick<[number, number]>([[1, 3], [1, 2], [2, 3], [3, 4], [5, 6], [1, 6], [1, 4]])
      const R = rng.pick([2, 3, 4, 6, 8, 12])
      const area = (R * R * n) / (2 * d)
      return {
        prompt: `Знайдіть площу сектора кола радіуса ${R} см, якщо його центральний кут дорівнює $${piTex(n, d)}$ (у см²).`,
        answer: { kind: 'number', value: area * Math.PI },
        answerTex: piTex(R * R * n, 2 * d),
        hints: ['Для кута в радіанах площа сектора $S = \\dfrac{\\alpha R^2}{2}$.', `Підстав $\\alpha = ${piTex(n, d)}$ і $R = ${R}$.`],
        solution: [`$S = \\dfrac{\\alpha R^2}{2} = \\dfrac{${piTex(n, d)} \\cdot ${R * R}}{2} = ${piTex(R * R * n, 2 * d)}$ (см²).`],
        inputHint: 'Можна ввести як 6π або як число',
      }
    }),

    exercise('compare-angles', 3, 'Порівняти кути в різних мірах', (rng) => {
      const rad = rng.pick([1.2, 1.5, 2, 2.5, 3, 0.8, 4])
      const deg = Math.round((rad * 180) / Math.PI + rng.pick([-25, -15, 15, 25]))
      const real = (rad * 180) / Math.PI
      const bigger = real > deg ? `${String(rad).replace('.', ',')} рад` : `${deg}°`
      return {
        prompt: `Який кут більший: $${String(rad).replace('.', '{,}')}$ рад чи $${deg}^\\circ$? (Візьми $\\pi \\approx 3{,}14$.)`,
        answer: choiceAnswer(rng, bigger, [real > deg ? `${deg}°` : `${String(rad).replace('.', ',')} рад`, 'вони рівні']),
        hints: ['Переведи обидва кути в одну міру, наприклад у градуси.', `$1$ рад $\\approx 57{,}3^\\circ$, тому $${String(rad).replace('.', '{,}')}$ рад $\\approx ${(rad * 57.3).toFixed(1).replace('.', '{,}')}^\\circ$.`],
        solution: [`$${String(rad).replace('.', '{,}')}$ рад $= ${String(rad).replace('.', '{,}')} \\cdot \\dfrac{180^\\circ}{\\pi} \\approx ${real.toFixed(1).replace('.', '{,}')}^\\circ$.`, `Порівнюємо з $${deg}^\\circ$: більший — ${bigger}.`],
      }
    }),

    exercise('turns', 3, 'Кут повороту колеса', (rng) => {
      const whole = rng.int(1, 4)
      const [p, q] = rng.pick<[number, number]>([[1, 2], [1, 4], [3, 4], [1, 3], [2, 3], [1, 6], [5, 6]])
      const turns = whole + p / q
      const total = 2 * (whole * q + p)
      return {
        prompt: `Колесо зробило ${whole} повних оберти(-ів) і ще $\\dfrac{${p}}{${q}}$ оберту. На який кут (у радіанах) воно повернулося? Запишіть, напр., «7π/2».`,
        answer: { kind: 'number', value: turns * 2 * Math.PI },
        answerTex: piTex(total, q),
        hints: ['Один повний оберт — це $2\\pi$ радіанів.', `Усього обертів: $${whole} + \\dfrac{${p}}{${q}}$. Помнож на $2\\pi$.`],
        solution: [`Повороти: $${whole} + \\dfrac{${p}}{${q}} = \\dfrac{${whole * q + p}}{${q}}$ оберту.`, `Кут: $2\\pi \\cdot \\dfrac{${whole * q + p}}{${q}} = ${piTex(total, q)}$.`],
      }
    }),
  ],
})
