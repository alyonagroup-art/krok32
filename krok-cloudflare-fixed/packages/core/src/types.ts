/**
 * Базові типи платформи. Нічого тут не знає про математику чи React:
 * предмет = дерево тем, тема = урок + приклади + генератори задач.
 * Тому сюди можна додавати будь-які предмети (фізика, хімія, мова...).
 */

// ───────────────────────── Випадковість ─────────────────────────

export interface Rng {
  readonly seed: number
  /** [0, 1) */
  next(): number
  /** ціле у [min, max] включно */
  int(min: number, max: number): number
  /** ціле у [min, max], але не 0 */
  nonZero(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  shuffle<T>(items: readonly T[]): T[]
  sign(): 1 | -1
  chance(p: number): boolean
  /** n цілих у [min, max]; distinct = без повторів */
  ints(n: number, min: number, max: number, opts?: { distinct?: boolean }): number[]
}

// ───────────────────────── Відповіді ─────────────────────────

/**
 * Опис правильної відповіді. Перевірка — у answers/check.ts.
 * Учень вводить звичайний текст (десяткова кома, √, ^, дроби 3/4, "x=2"...),
 * а ми порівнюємо за змістом, а не за написанням.
 */
export type AnswerSpec =
  /** число (можна виразом: "2√3", "3/4", "pi/6") */
  | { kind: 'number'; value: number; tolerance?: number; unit?: string }
  /** вираз зі змінними — еквівалентність перевіряється числово */
  | {
      kind: 'expression'
      value: string
      /** якщо введений текст збігається з одним із цих (після нормалізації) — не зараховуємо */
      rejectLiteral?: string[]
      /** підказка, що саме не так, якщо відповідь еквівалентна, але у «неправильній формі» */
      rejectMessage?: string
    }
  /** рівняння виду y = kx + b; еквівалентність з точністю до множника */
  | { kind: 'equation'; value: string }
  /** множина чисел (корені рівняння...), порядок неважливий; порожня = «немає розв'язків» */
  | { kind: 'numberSet'; values: number[] }
  /** впорядкований набір чисел: пара (x; y), трійка координат... */
  | { kind: 'tuple'; values: number[] }
  /** числовий проміжок / об'єднання, напр. "(-inf; 2] U [5; +inf)" */
  | { kind: 'interval'; value: string }
  /** вибір з варіантів (індекси правильних) */
  | { kind: 'choice'; options: string[]; correct: number[]; multiple?: boolean }
  /** короткий текст (термін, слово) */
  | { kind: 'text'; accept: string[] }

export interface CheckResult {
  correct: boolean
  /** коротке пояснення, чому не зараховано (необов'язково) */
  feedback?: string
  /** вхід не вдалося розпізнати */
  unreadable?: boolean
}

// ───────────────────────── Малюнки ─────────────────────────

/**
 * Малюнок у математичних координатах (y вгору). Рендериться SVG-компонентом.
 * Підходить і для геометричних фігур, і для графіків функцій.
 */
export interface Figure {
  /** [xmin, ymin, xmax, ymax] у математичних координатах */
  view: [number, number, number, number]
  /** ширина у px (висота рахується з пропорцій), за замовчуванням 360 */
  width?: number
  /** іменовані точки; підписуються автоматично, якщо не у hideLabels */
  points?: Record<string, [number, number]>
  hideLabels?: string[]
  /** зсув підпису точки у напрямку (dx, dy) в одиницях px; за замовчуванням — від центру фігури */
  labelOffsets?: Record<string, [number, number]>
  items?: FigureItem[]
  /** осі координат і сітка (для графіків) */
  axes?: boolean | { grid?: boolean; ticks?: boolean; xLabel?: string; yLabel?: string }
  caption?: string
}

export type PointRef = string | [number, number]

export type FigureItem =
  | { t: 'seg'; a: PointRef; b: PointRef; style?: 'solid' | 'dashed' | 'bold'; color?: Color; ticks?: 1 | 2 | 3; label?: string; labelSide?: 1 | -1 }
  | { t: 'line'; a: PointRef; b: PointRef; style?: 'solid' | 'dashed'; color?: Color }
  | { t: 'arrow'; a: PointRef; b: PointRef; color?: Color; label?: string }
  | { t: 'poly'; pts: PointRef[]; fill?: Color; stroke?: boolean; color?: Color; dashed?: boolean }
  | { t: 'circle'; c: PointRef; r: number; fill?: Color; color?: Color; dashed?: boolean }
  /** дуга кута між променями at→from та at→to (проти годинникової від from до to) */
  | { t: 'angle'; at: PointRef; from: PointRef; to: PointRef; label?: string; r?: number; right?: boolean; arcs?: 1 | 2 | 3; color?: Color }
  | { t: 'dot'; at: PointRef; color?: Color; hollow?: boolean }
  | { t: 'text'; at: PointRef; text: string; color?: Color; size?: number }
  /** графік функції; expr — вираз від x ("x^2-4x+3"), domain — обмеження області */
  | { t: 'plot'; expr: string; domain?: [number, number]; color?: Color; dashed?: boolean; label?: string; holes?: number[] }
  /** виділена область для нерівностей на числовій прямій тощо — просто товстий відрізок */
  | { t: 'tickmark'; at: PointRef; color?: Color }

export type Color = 'ink' | 'red' | 'green' | 'orange' | 'violet' | 'gray'

// ───────────────────────── Задачі ─────────────────────────

/** Крок розв'язання: маленьке питання, на яке можна відповісти окремо. */
export interface Step {
  prompt: string
  answer: AnswerSpec
  hint?: string
  /** що пояснюємо після кроку (показується після відповіді або «показати») */
  explanation: string
}

/** Конкретна задача — результат виклику генератора з конкретним seed. */
export interface Problem {
  /** markdown + $LaTeX$ */
  prompt: string
  figure?: Figure
  answer: AnswerSpec
  /** правильна відповідь у LaTeX для показу (без $) */
  answerTex?: string
  /** підказки від м'якої до майже готової; показуються по одній */
  hints: string[]
  /** розв'язання: кожен елемент — один рядок/крок (markdown + LaTeX) */
  solution: string[]
  /** розбиття на підкроки («Не виходить? Розіб'ємо на кроки») */
  steps?: Step[]
  /** підказка про формат вводу, напр. «Введи корені через крапку з комою» */
  inputHint?: string
}

export type Difficulty = 1 | 2 | 3

export interface ExerciseTemplate {
  /** унікальний у межах теми */
  id: string
  /** 1 — базово, 2 — стандарт, 3 — складніше / НМТ */
  difficulty: Difficulty
  /** короткий опис типу задачі (для розробників і для статистики помилок) */
  skill: string
  generate(rng: Rng): Problem
}

// ───────────────────────── Теорія ─────────────────────────

export type Block =
  | { type: 'text'; md: string }
  /** «Спочатку інтуїція» — простими словами, як пояснив би репетитор */
  | { type: 'intuition'; md: string }
  | { type: 'definition'; term: string; md: string }
  | { type: 'rule'; title?: string; md: string }
  | { type: 'warning'; md: string }
  | { type: 'tip'; md: string }
  | { type: 'figure'; figure: Figure }
  /** нумерований алгоритм: «Як це робити» */
  | { type: 'algorithm'; title: string; steps: string[] }
  /** міні-перевірка на місці: питання → відкрити відповідь */
  | { type: 'check'; question: string; answer: string; explain?: string }

export interface LessonSection {
  title: string
  blocks: Block[]
}

/** Розібраний приклад: умова + покроковий розбір «що думаємо і чому». */
export interface WorkedExample {
  title?: string
  problem: string
  figure?: Figure
  steps: { think?: string; do: string }[]
  answer: string
}

export interface Formula {
  title: string
  tex: string
  note?: string
}

export interface Mistake {
  wrong: string
  why: string
  right: string
}

export interface Topic {
  /** стабільний id: "a7-power" */
  id: string
  subject: string
  /** клас: 7..11 (або 0 для предметів без класів) */
  grade: number
  /** розділ у межах класу */
  chapter: string
  title: string
  /** 1–2 речення: про що ця тема і навіщо */
  summary: string
  /** id тем, які треба знати перед цією */
  prereqs: string[]
  estMinutes: number
  tags?: string[]
  lesson: LessonSection[]
  examples: WorkedExample[]
  formulas?: Formula[]
  mistakes?: Mistake[]
  exercises: ExerciseTemplate[]
  /** чи це заготовка без матеріалів (відображається як «скоро») */
  stub?: boolean
}

export interface Chapter {
  id: string
  title: string
  grade: number
}

export interface Subject {
  id: string
  title: string
  /** емодзі або короткий символ */
  icon: string
  description: string
  grades: number[]
  /** CSS-колір акценту предмета */
  color: string
  /** розділи/глави (порядок) */
  chapters: Chapter[]
  topics: Topic[]
}

// ───────────────────────── Прогрес ─────────────────────────

export interface TopicProgress {
  /** 0..1 — поточна оцінка володіння */
  mastery: number
  attempts: number
  correct: number
  /** кошик інтервального повторення 0..6 */
  box: number
  /** ISO-дата, коли тему час повторити (якщо вже пройдена) */
  due?: string
  lastSeen?: string
  lessonRead?: boolean
  bestTest?: number
  /** помилки по типах задач: skill -> кількість */
  weakSkills?: Record<string, number>
}

export interface ActivityDay {
  /** YYYY-MM-DD */
  date: string
  answered: number
  correct: number
}

export interface ProgressState {
  version: 1
  profile: { name: string; grade: number }
  topics: Record<string, TopicProgress>
  activity: ActivityDay[]
  /** теми, які учень сам позначив «хочу повторити» або діагностика виявила прогалини */
  flagged: string[]
}

/** Результат однієї відповіді, який подається у трекер. */
export interface AttemptResult {
  topicId: string
  skill: string
  correct: boolean
  /** скільки підказок відкрито (0..n) */
  hintsUsed: number
  /** чи показано розв'язання/кроки */
  solutionShown: boolean
  /** чи це режим тесту (без підказок, вага вища) */
  isTest?: boolean
}
