import type { Figure, FigureItem } from '@krok/core'
import { choiceAnswer, exercise, figure, polar, topicFactory } from '../../lib'

const topic = topicFactory('geometry', 7)

/**
 * Дві прямі AB і CD перетинаються в O. Промінь OA іде під кутом θ, OC — під кутом θ + α.
 * Порядок променів проти годинникової: OA, OC, OB, OD. ∠AOC = ∠BOD = α, ∠COB = ∠DOA = 180° − α.
 */
function crossing(alpha: number, labels?: { aoc?: string; cob?: string; bod?: string; doa?: string }, theta = 15): Figure {
  const O: [number, number] = [0, 0]
  const A = polar(0, 0, 2.2, theta)
  const C = polar(0, 0, 2.2, theta + alpha)
  const B = polar(0, 0, 2.2, theta + 180)
  const D = polar(0, 0, 2.2, theta + alpha + 180)
  const items: FigureItem[] = [
    { t: 'seg', a: 'A', b: 'B' },
    { t: 'seg', a: 'C', b: 'D' },
    { t: 'dot', at: 'O' },
  ]
  if (labels?.aoc) items.push({ t: 'angle', at: 'O', from: 'A', to: 'C', label: labels.aoc, r: 0.55, color: 'red' })
  if (labels?.cob) items.push({ t: 'angle', at: 'O', from: 'C', to: 'B', label: labels.cob, r: 0.55, color: 'green' })
  if (labels?.bod) items.push({ t: 'angle', at: 'O', from: 'B', to: 'D', label: labels.bod, r: 0.55, color: 'red' })
  if (labels?.doa) items.push({ t: 'angle', at: 'O', from: 'D', to: 'A', label: labels.doa, r: 0.55, color: 'green' })
  return figure({ A, B, C, D, O }, items, { width: 300, labelOffsets: { O: [10, -12] } })
}

export default topic('g7-1', {
  id: 'g7-angles',
  title: 'Кути: бісектриса, суміжні та вертикальні',
  summary: 'Що таке кут і як його вимірюють; суміжні та вертикальні кути — чому вони завжди «зв’язані» між собою; бісектриса кута.',
  prereqs: ['g7-basic'],
  estMinutes: 35,
  tags: ['кути', 'суміжні', 'вертикальні', 'бісектриса'],

  lesson: [
    {
      title: 'Кут і його міра',
      blocks: [
        {
          type: 'definition',
          term: 'Кут',
          md: 'Фігура, утворена двома променями з **спільним початком**. Промені — сторони кута, спільний початок — вершина. Кут позначають трьома буквами з вершиною посередині: $\\angle AOB$ (читають: «кут $AOB$»).',
        },
        {
          type: 'rule',
          title: 'Градусна міра',
          md: 'Кут вимірюють транспортиром у градусах. Розгорнутий кут (сторони — доповняльні промені однієї прямої) дорівнює $180^\\circ$. Прямий — $90^\\circ$. Гострий $< 90^\\circ$, тупий — від $90^\\circ$ до $180^\\circ$.',
        },
        {
          type: 'tip',
          md: 'Кути додаються: якщо промінь $OC$ лежить усередині кута $AOB$, то $\\angle AOB = \\angle AOC + \\angle COB$. Це головний інструмент усіх задач про кути.',
        },
      ],
    },
    {
      title: 'Суміжні кути',
      blocks: [
        {
          type: 'definition',
          term: 'Суміжні кути',
          md: 'Два кути, у яких **одна сторона спільна**, а дві інші сторони — доповняльні промені (разом утворюють пряму).',
        },
        {
          type: 'figure',
          figure: figure(
            { A: [-2.2, 0], O: [0, 0], B: [2.2, 0], C: polar(0, 0, 2, 58) },
            [
              { t: 'seg', a: 'A', b: 'B' },
              { t: 'seg', a: 'O', b: 'C' },
              { t: 'angle', at: 'O', from: 'B', to: 'C', label: 'α', r: 0.6, color: 'red' },
              { t: 'angle', at: 'O', from: 'C', to: 'A', label: '180°−α', r: 0.7, color: 'green' },
            ],
            { width: 320, labelOffsets: { O: [0, -16] }, caption: '$\\angle BOC$ і $\\angle COA$ — суміжні: разом вони складають розгорнутий кут.' },
          ),
        },
        {
          type: 'rule',
          title: 'Властивість суміжних кутів',
          md: 'Сума суміжних кутів дорівнює $180^\\circ$.',
        },
        {
          type: 'intuition',
          md: 'Уяви двері, які відчиняються від стіни. Якщо відчинити на $\\alpha$, то по інший бік залишиться «щілина» в $180^\\circ - \\alpha$. Разом — рівно півоберта, тобто пряма.',
        },
        {
          type: 'check',
          question: 'Один із суміжних кутів дорівнює $65^\\circ$. Чому дорівнює другий?',
          answer: '$115^\\circ$',
          explain: '$180^\\circ - 65^\\circ = 115^\\circ$.',
        },
      ],
    },
    {
      title: 'Вертикальні кути',
      blocks: [
        {
          type: 'definition',
          term: 'Вертикальні кути',
          md: 'Два кути, у яких сторони одного є **доповняльними променями** сторін другого. Вони утворюються, коли перетинаються дві прямі.',
        },
        {
          type: 'figure',
          figure: crossing(50, { aoc: '50°', bod: '50°', cob: '130°', doa: '130°' }),
        },
        {
          type: 'rule',
          title: 'Властивість вертикальних кутів',
          md: 'Вертикальні кути **рівні**.',
        },
        {
          type: 'text',
          md: '**Чому?** Нехай $\\angle AOC = \\alpha$. Тоді суміжний із ним $\\angle COB = 180^\\circ - \\alpha$. Але $\\angle BOD$ також суміжний із $\\angle COB$, тому $\\angle BOD = 180^\\circ - (180^\\circ - \\alpha) = \\alpha$. Отже, $\\angle BOD = \\angle AOC$. На малюнку червоні кути рівні між собою, зелені — теж.',
        },
        {
          type: 'warning',
          md: 'Не плутай: **суміжні** кути в сумі дають $180^\\circ$, а **вертикальні** — **рівні**. Коли дві прямі перетинаються, утворюється 4 кути: два з однією мірою $\\alpha$, два з іншою $180^\\circ - \\alpha$.',
        },
      ],
    },
    {
      title: 'Бісектриса кута',
      blocks: [
        {
          type: 'definition',
          term: 'Бісектриса кута',
          md: 'Промінь, що виходить із вершини кута, лежить усередині нього і **ділить кут навпіл**. Якщо $OC$ — бісектриса $\\angle AOB$, то $\\angle AOC = \\angle COB = \\dfrac12 \\angle AOB$.',
        },
        {
          type: 'figure',
          figure: figure(
            { O: [0, 0], A: polar(0, 0, 2.4, 10), B: polar(0, 0, 2.4, 110), C: polar(0, 0, 2.4, 60) },
            [
              { t: 'seg', a: 'O', b: 'A' },
              { t: 'seg', a: 'O', b: 'B' },
              { t: 'seg', a: 'O', b: 'C', style: 'dashed', color: 'red' },
              { t: 'angle', at: 'O', from: 'A', to: 'C', label: 'α', r: 0.8, color: 'red', arcs: 1 },
              { t: 'angle', at: 'O', from: 'C', to: 'B', label: 'α', r: 0.8, color: 'red', arcs: 1 },
            ],
            { width: 300, labelOffsets: { O: [-8, -14] }, caption: '$OC$ — бісектриса кута $AOB$: $\\angle AOC = \\angle COB$.' },
          ),
        },
        {
          type: 'tip',
          md: 'У задачах з бісектрисою позначай рівні половинки однією буквою ($\\alpha$ і $\\alpha$) — тоді весь кут $= 2\\alpha$, і рівняння складається саме.',
        },
      ],
    },
  ],

  examples: [
    {
      title: 'Суміжні кути у відношенні',
      problem: 'Суміжні кути відносяться як $2 : 7$. Знайдіть ці кути.',
      steps: [
        { think: 'Відношення $2:7$ означає, що кути складаються з 2 та 7 однакових «частин». Позначу одну частину через $x$.', do: 'Кути: $2x$ і $7x$.' },
        { think: 'Суміжні — у сумі $180^\\circ$.', do: '$2x + 7x = 180^\\circ \\Rightarrow 9x = 180^\\circ \\Rightarrow x = 20^\\circ$.' },
        { do: 'Кути: $2 \\cdot 20^\\circ = 40^\\circ$ та $7 \\cdot 20^\\circ = 140^\\circ$. Перевірка: $40 + 140 = 180$ ✓.' },
      ],
      answer: '$40^\\circ$ і $140^\\circ$',
    },
    {
      title: 'Вертикальні кути з невідомим',
      problem: 'Прямі $AB$ і $CD$ перетинаються в точці $O$. $\\angle AOC = (3x + 10)^\\circ$, $\\angle BOD = (5x - 30)^\\circ$. Знайдіть $\\angle AOC$.',
      steps: [
        { think: '$\\angle AOC$ і $\\angle BOD$ — вертикальні, отже, рівні.', do: '$3x + 10 = 5x - 30$.' },
        { do: '$40 = 2x \\Rightarrow x = 20$.' },
        { do: '$\\angle AOC = 3 \\cdot 20 + 10 = 70^\\circ$. Перевірка: $5 \\cdot 20 - 30 = 70$ ✓.' },
      ],
      answer: '$70^\\circ$',
    },
    {
      title: 'Бісектриса',
      problem: '$OC$ — бісектриса кута $AOB$, $\\angle AOC = 38^\\circ$. Знайдіть кут $AOB$ і кут, суміжний із ним.',
      steps: [
        { think: 'Бісектриса ділить кут навпіл, тому весь кут удвічі більший за половинку.', do: '$\\angle AOB = 2 \\cdot 38^\\circ = 76^\\circ$.' },
        { do: 'Суміжний: $180^\\circ - 76^\\circ = 104^\\circ$.' },
      ],
      answer: '$76^\\circ$ і $104^\\circ$',
    },
  ],

  formulas: [
    { title: 'Суміжні кути', tex: '\\alpha + \\beta = 180^\\circ' },
    { title: 'Вертикальні кути', tex: '\\angle AOC = \\angle BOD' },
    { title: 'Бісектриса', tex: '\\angle AOC = \\angle COB = \\tfrac12 \\angle AOB' },
  ],

  mistakes: [
    { wrong: '«Вертикальні кути в сумі дають $180^\\circ$».', why: 'Це властивість суміжних кутів.', right: 'Вертикальні кути рівні.' },
    { wrong: '«Суміжні кути рівні».', why: 'Рівні вони лише коли обидва прямі.', right: 'Сума суміжних кутів $= 180^\\circ$.' },
    { wrong: '$\\angle AOB = 38^\\circ$, бо $OC$ — бісектриса.', why: 'Бісектриса дає половину кута, а не весь кут.', right: '$\\angle AOB = 2 \\cdot 38^\\circ = 76^\\circ$.' },
  ],

  exercises: [
    exercise('supplementary', 1, 'Знайти суміжний кут', (rng) => {
      const a = rng.int(20, 160)
      return {
        prompt: `Один із суміжних кутів дорівнює $${a}^\\circ$. Знайдіть другий кут (у градусах).`,
        answer: { kind: 'number', value: 180 - a },
        answerTex: `${180 - a}^\\circ`,
        hints: ['Що відомо про суму двох суміжних кутів?', 'Сума суміжних кутів — $180^\\circ$. Від $180^\\circ$ відніми відомий кут.'],
        solution: [`Сума суміжних кутів $= 180^\\circ$.`, `$180^\\circ - ${a}^\\circ = ${180 - a}^\\circ$.`],
      }
    }),

    exercise('vertical-fig', 1, 'Знайти вертикальний кут за малюнком', (rng) => {
      const alpha = rng.int(25, 155)
      const askVertical = rng.chance(0.5)
      const fig = crossing(alpha, { aoc: `${alpha}°`, [askVertical ? 'bod' : 'cob']: '?' })
      const ans = askVertical ? alpha : 180 - alpha
      return {
        prompt: `Прямі $AB$ і $CD$ перетинаються в точці $O$, $\\angle AOC = ${alpha}^\\circ$. Знайдіть $\\angle ${askVertical ? 'BOD' : 'COB'}$ (у градусах).`,
        figure: fig,
        answer: { kind: 'number', value: ans },
        answerTex: `${ans}^\\circ`,
        hints: askVertical
          ? [`Подивись на малюнок: чи є кути $AOC$ і $BOD$ вертикальними?`, `Вертикальні кути рівні.`]
          : [`Кути $AOC$ і $COB$ мають спільну сторону $OC$, а їх інші сторони $OA$ і $OB$ утворюють пряму. Як такі кути називаються?`, `Суміжні кути в сумі дають $180^\\circ$.`],
        solution: askVertical
          ? [`$\\angle AOC$ і $\\angle BOD$ — вертикальні, тому рівні: $\\angle BOD = ${alpha}^\\circ$.`]
          : [`$\\angle AOC$ і $\\angle COB$ — суміжні, тому $\\angle COB = 180^\\circ - ${alpha}^\\circ = ${180 - alpha}^\\circ$.`],
      }
    }),

    exercise('which-property', 1, 'Вибрати властивість: суміжні чи вертикальні', (rng) => {
      const alpha = rng.int(30, 150)
      const alt = rng.pick(['AOC і BOD', 'COB і DOA', 'AOC і COB', 'BOD і DOA'])
      const vertical = alt === 'AOC і BOD' || alt === 'COB і DOA'
      return {
        prompt: `Прямі $AB$ і $CD$ перетинаються в точці $O$, $\\angle AOC = ${alpha}^\\circ$. Кути $${alt.replace(' і ', '$ і $')}$ — це...`,
        figure: crossing(alpha),
        answer: choiceAnswer(rng, vertical ? 'вертикальні, тому рівні' : 'суміжні, тому в сумі $180^\\circ$', [
          vertical ? 'суміжні, тому в сумі $180^\\circ$' : 'вертикальні, тому рівні',
          'ні суміжні, ні вертикальні',
        ]),
        hints: [`Подивись, чи мають ці два кути спільну сторону.`, `Мають спільну сторону і разом утворюють пряму — суміжні. Не мають спільної сторони (протилежні) — вертикальні.`],
        solution: [vertical ? `Ці кути протилежні один одному (не мають спільної сторони) — вони вертикальні, тому рівні.` : `Ці кути мають спільну сторону, а інші їхні сторони лежать на одній прямій — вони суміжні, сума $180^\\circ$.`],
      }
    }),

    exercise('difference', 2, 'Суміжні кути: різниця', (rng) => {
      const small = rng.int(25, 70)
      const big = 180 - small
      const d = big - small
      return {
        prompt: `Суміжні кути відрізняються на $${d}^\\circ$. Знайдіть більший із них (у градусах).`,
        answer: { kind: 'number', value: big },
        answerTex: `${big}^\\circ`,
        hints: [`Нехай менший кут $x$, тоді більший $x + ${d}$.`, `Разом вони дають $180^\\circ$: $x + (x + ${d}) = 180$.`],
        solution: [`Нехай менший $x$, більший $x + ${d}$.`, `$2x + ${d} = 180 \\Rightarrow x = ${small}$.`, `Більший кут: $${small} + ${d} = ${big}^\\circ$.`],
        steps: [
          { prompt: `Нехай менший кут $x$. Складіть і розв'яжіть рівняння: чому дорівнює $x$?`, answer: { kind: 'number', value: small }, hint: `$x + (x + ${d}) = 180$`, explanation: `$2x = ${180 - d}$, $x = ${small}$.` },
          { prompt: `Тоді більший кут дорівнює...`, answer: { kind: 'number', value: big }, explanation: `$${small} + ${d} = ${big}^\\circ$.` },
        ],
      }
    }),

    exercise('ratio', 2, 'Суміжні кути у відношенні', (rng) => {
      // відношення, сума частин якого ділить 180
      const [pm, pn] = rng.pick<[number, number]>([[1, 2], [1, 3], [1, 4], [1, 5], [1, 8], [2, 3], [2, 7], [3, 7], [4, 5], [1, 11], [5, 7], [7, 11]])
      const x = 180 / (pm + pn)
      return {
        prompt: `Суміжні кути відносяться як $${pm} : ${pn}$. Знайдіть менший із цих кутів (у градусах).`,
        answer: { kind: 'number', value: pm * x },
        answerTex: `${pm * x}^\\circ`,
        hints: [`Позначте одну «частину» через $x$: кути $${pm}x$ і $${pn}x$.`, `Сума суміжних — $180^\\circ$, тобто $${pm}x + ${pn}x = 180$.`],
        solution: [`Кути $${pm}x$ і $${pn}x$.`, `$${pm}x + ${pn}x = 180 \\Rightarrow ${pm + pn}x = 180 \\Rightarrow x = ${x}$.`, `Менший кут: $${pm} \\cdot ${x} = ${pm * x}^\\circ$.`],
      }
    }),

    exercise('bisector', 2, 'Бісектриса: знайти кут', (rng) => {
      const half = rng.int(15, 85)
      const toWhole = rng.chance(0.5)
      return toWhole
        ? {
            prompt: `$OC$ — бісектриса кута $AOB$, $\\angle AOC = ${half}^\\circ$. Знайдіть $\\angle AOB$ (у градусах).`,
            answer: { kind: 'number', value: 2 * half },
            answerTex: `${2 * half}^\\circ`,
            hints: [`Бісектриса ділить кут на дві рівні частини.`, `Увесь кут удвічі більший за половину.`],
            solution: [`$\\angle AOB = 2 \\cdot \\angle AOC = 2 \\cdot ${half}^\\circ = ${2 * half}^\\circ$.`],
          }
        : {
            prompt: `$OC$ — бісектриса кута $AOB$, $\\angle AOB = ${2 * half}^\\circ$. Знайдіть $\\angle COB$ (у градусах).`,
            answer: { kind: 'number', value: half },
            answerTex: `${half}^\\circ`,
            hints: [`Що робить бісектриса з кутом?`, `Ділить навпіл: $\\angle COB = \\angle AOB : 2$.`],
            solution: [`$\\angle COB = \\dfrac12 \\angle AOB = ${half}^\\circ$.`],
          }
    }),

    exercise('equation-vertical', 2, 'Вертикальні кути: рівняння', (rng) => {
      const x = rng.int(10, 22)
      const k1 = rng.int(2, 4)
      const k2 = k1 + rng.int(1, 2)
      // (k2 - k1)·x > c2 > 0  ⇒  c1 = (k2 - k1)·x - c2 > 0
      const c2 = rng.int(3, (k2 - k1) * x - 3)
      const c1 = (k2 - k1) * x - c2
      const val = k1 * x + c1
      return {
        prompt: `Прямі $AB$ і $CD$ перетинаються в точці $O$. $\\angle AOC = (${k1}x + ${c1})^\\circ$, $\\angle BOD = (${k2}x - ${c2})^\\circ$. Знайдіть $\\angle AOC$ (у градусах).`,
        figure: crossing(Math.min(150, Math.max(30, val)), { aoc: `(${k1}x+${c1})°`, bod: `(${k2}x−${c2})°` }),
        answer: { kind: 'number', value: val },
        answerTex: `${val}^\\circ`,
        hints: [`Які це кути: суміжні чи вертикальні? Що можна сказати про їхні міри?`, `Вертикальні кути рівні: $${k1}x + ${c1} = ${k2}x - ${c2}$.`, `Знайди $x$, потім підстав у вираз для $\\angle AOC$.`],
        solution: [`$\\angle AOC$ і $\\angle BOD$ вертикальні, тому рівні: $${k1}x + ${c1} = ${k2}x - ${c2}$.`, `$${c1 + c2} = ${k2 - k1}x \\Rightarrow x = ${x}$.`, `$\\angle AOC = ${k1} \\cdot ${x} + ${c1} = ${val}^\\circ$.`],
      }
    }),

    exercise('sum-of-two', 3, 'Сума двох вертикальних кутів', (rng) => {
      const alpha = rng.int(20, 80) // гострий кут
      const sum = 2 * alpha
      return {
        prompt: `Прямі $AB$ і $CD$ перетинаються в точці $O$. Сума кутів $AOC$ і $BOD$ дорівнює $${sum}^\\circ$. Знайдіть кут $AOD$ (у градусах).`,
        figure: crossing(alpha),
        answer: { kind: 'number', value: 180 - alpha },
        answerTex: `${180 - alpha}^\\circ`,
        hints: [`$\\angle AOC$ і $\\angle BOD$ — вертикальні. Чому вони рівні між собою?`, `Кожен із них дорівнює $${sum} : 2$. А $\\angle AOD$ суміжний з одним із них.`],
        solution: [`Вертикальні кути рівні, тому $\\angle AOC = \\angle BOD = ${sum} : 2 = ${alpha}^\\circ$.`, `$\\angle AOD$ суміжний з $\\angle AOC$: $180^\\circ - ${alpha}^\\circ = ${180 - alpha}^\\circ$.`],
      }
    }),
  ],
})
