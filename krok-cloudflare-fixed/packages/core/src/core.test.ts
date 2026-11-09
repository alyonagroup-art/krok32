import { describe, expect, it } from 'vitest'
import { checkAnswer, evalNumber, createRng, applyAttempt, emptyProgress, topicStatus, dueTopicIds, mdToPlain, parseIntervals, currentStreak } from './index'
import type { AnswerSpec } from './types'

const ok = (spec: AnswerSpec, input: string) => checkAnswer(spec, input).correct

describe('evalNumber', () => {
  it('розуміє шкільний запис', () => {
    expect(evalNumber('1,5')).toBe(1.5)
    expect(evalNumber('-3/4')).toBeCloseTo(-0.75)
    expect(evalNumber('1 1/2')).toBe(1.5)
    expect(evalNumber('2√3')).toBeCloseTo(3.4641016)
    expect(evalNumber('√(16)')).toBe(4)
    expect(evalNumber('−2')).toBe(-2)
    expect(evalNumber('2^3')).toBe(8)
    expect(evalNumber('2³')).toBe(8)
    expect(evalNumber('30°')).toBe(30)
    expect(evalNumber('π/6')).toBeCloseTo(Math.PI / 6)
    expect(evalNumber('sin(30)')).not.toBeNull()
    expect(evalNumber('abc +')).toBeNull()
    expect(evalNumber('')).toBeNull()
    expect(evalNumber('1/0')).toBeNull()
  })
})

describe('number', () => {
  const spec: AnswerSpec = { kind: 'number', value: 0.75 }
  it('приймає еквівалентні записи', () => {
    for (const s of ['0.75', '0,75', '3/4', '6/8', '75/100', 'x=3/4']) expect(ok(spec, s), s).toBe(true)
    expect(ok(spec, '0.7')).toBe(false)
  })
  it('допуск', () => {
    expect(ok({ kind: 'number', value: 3.14, tolerance: 0.01 }, '3,141')).toBe(true)
    expect(ok({ kind: 'number', value: 3.14, tolerance: 0.01 }, '3.2')).toBe(false)
  })
  it('нечитабельне', () => {
    expect(checkAnswer(spec, 'не знаю').unreadable).toBe(true)
  })
})

describe('expression', () => {
  const spec: AnswerSpec = { kind: 'expression', value: 'x^2 - 4x + 4' }
  it('еквівалентність', () => {
    for (const s of ['x^2-4x+4', '(x-2)^2', '(x-2)(x-2)', '4 - 4x + x²', '4 + x^2 - 4*x', 'х^2-4х+4']) expect(ok(spec, s), s).toBe(true)
    expect(ok(spec, 'x^2+4')).toBe(false)
    expect(ok(spec, '(x+2)^2')).toBe(false)
  })
  it('rejectLiteral — не зараховує те, що вже було в умові', () => {
    const s: AnswerSpec = { kind: 'expression', value: '(x-2)^2', rejectLiteral: ['x^2-4x+4'] }
    expect(ok(s, '(x-2)^2')).toBe(true)
    expect(ok(s, 'x^2-4x+4')).toBe(false)
    expect(checkAnswer(s, 'x^2 - 4x + 4').feedback).toBeTruthy()
  })
  it('дробово-раціональні й корені', () => {
    expect(ok({ kind: 'expression', value: '1/(x-1)' }, '1/(x-1)')).toBe(true)
    expect(ok({ kind: 'expression', value: '(x+1)' }, '(x^2-1)/(x-1)')).toBe(true)
    expect(ok({ kind: 'expression', value: '2sqrt(x)' }, '2√x')).toBe(true)
    expect(ok({ kind: 'expression', value: 'sin(x)^2+cos(x)^2' }, '1')).toBe(true)
    expect(ok({ kind: 'expression', value: 'tan(x)' }, 'tg x')).toBe(true)
  })
  it('відхиляє «=» всередині', () => {
    expect(checkAnswer(spec, 'x=2').correct).toBe(false)
  })
  it('y= на початку ігнорується', () => {
    expect(ok({ kind: 'expression', value: '2x+1' }, 'y = 2x + 1')).toBe(true)
  })
})

describe('equation', () => {
  const spec: AnswerSpec = { kind: 'equation', value: 'y = 2x + 3' }
  it('з точністю до множника та перенесень', () => {
    for (const s of ['y=2x+3', 'y = 3 + 2x', '2x - y + 3 = 0', '2y = 4x + 6', 'у=2х+3']) expect(ok(spec, s), s).toBe(true)
    expect(ok(spec, 'y=2x-3')).toBe(false)
    expect(ok(spec, 'y=3x+3')).toBe(false)
  })
  it('потрібен знак =', () => {
    expect(checkAnswer(spec, '2x+3').unreadable).toBe(true)
  })
})

describe('numberSet', () => {
  const spec: AnswerSpec = { kind: 'numberSet', values: [2, -3] }
  it('будь-який порядок і роздільники', () => {
    for (const s of ['2; -3', '-3; 2', '2, -3', '-3 , 2', 'x=2; x=-3', 'x1=-3, x2=2', '2 або -3', '{2; -3}', '2;-3;2']) expect(ok(spec, s), s).toBe(true)
    expect(ok(spec, '2')).toBe(false)
    expect(ok(spec, '2; 3')).toBe(false)
  })
  it('дробові корені: десяткова кома не плутається з роздільником', () => {
    expect(ok({ kind: 'numberSet', values: [1.5] }, '1,5')).toBe(true)
    expect(ok({ kind: 'numberSet', values: [1.5, 2] }, '1,5; 2')).toBe(true)
    expect(ok({ kind: 'numberSet', values: [1, 5] }, '1,5')).toBe(true) // двозначність допускається
  })
  it('порожня множина', () => {
    const e: AnswerSpec = { kind: 'numberSet', values: [] }
    for (const s of ['немає', '∅', 'коренів немає', 'розв’язків немає']) expect(ok(e, s), s).toBe(true)
    expect(ok(e, '0')).toBe(false)
    expect(ok(spec, 'немає')).toBe(false)
  })
  it('ірраціональні корені', () => {
    expect(ok({ kind: 'numberSet', values: [Math.sqrt(2), -Math.sqrt(2)] }, '±√2')).toBe(false) // ± не підтримуємо — просимо перелічити
    expect(ok({ kind: 'numberSet', values: [Math.sqrt(2), -Math.sqrt(2)] }, '√2; -√2')).toBe(true)
  })
})

describe('tuple', () => {
  const spec: AnswerSpec = { kind: 'tuple', values: [1, -2] }
  it('пара', () => {
    for (const s of ['(1; -2)', '1; -2', '(1, -2)', 'x=1; y=-2', 'x=1, y=-2']) expect(ok(spec, s), s).toBe(true)
    expect(ok(spec, '(-2; 1)')).toBe(false)
  })
})

describe('interval', () => {
  const spec: AnswerSpec = { kind: 'interval', value: '(-inf; 2] U (5; +inf)' }
  it('різні записи', () => {
    for (const s of ['(-∞; 2] ∪ (5; +∞)', '(-inf;2]U(5;inf)', 'x<=2 або x>5', 'x≤2 або x>5', '(-∞;2]∪(5;+∞)']) expect(ok(spec, s), s).toBe(true)
    expect(ok(spec, '(-∞; 2) ∪ (5; +∞)')).toBe(false)
    expect(ok(spec, '(-∞; +∞)')).toBe(false)
  })
  it('подвійні нерівності і точка', () => {
    expect(ok({ kind: 'interval', value: '[-2; 5)' }, '-2<=x<5')).toBe(true)
    expect(ok({ kind: 'interval', value: '[-2; 5)' }, '5>x>=-2')).toBe(true)
    expect(ok({ kind: 'interval', value: '{3}' }, '{3}')).toBe(true)
    expect(ok({ kind: 'interval', value: '(0; 1)' }, '(0;1)')).toBe(true)
  })
  it('злиття проміжків', () => {
    expect(parseIntervals('[1; 2] ∪ (2; 3]')).toEqual([{ lo: 1, hi: 3, loInc: true, hiInc: true }])
  })
  it('порожня', () => {
    expect(ok({ kind: 'interval', value: '∅' }, 'немає розв’язків')).toBe(true)
  })
})

describe('choice / text', () => {
  it('choice', () => {
    const spec: AnswerSpec = { kind: 'choice', options: ['a', 'b', 'c'], correct: [1] }
    expect(ok(spec, '1')).toBe(true)
    expect(ok(spec, '0')).toBe(false)
    const m: AnswerSpec = { kind: 'choice', options: ['a', 'b', 'c'], correct: [0, 2], multiple: true }
    expect(ok(m, '2,0')).toBe(true)
    expect(ok(m, '0')).toBe(false)
  })
  it('text', () => {
    const spec: AnswerSpec = { kind: 'text', accept: ['Бісектриса', 'бісектриса кута'] }
    expect(ok(spec, '  бісектриса. ')).toBe(true)
    expect(ok(spec, 'медіана')).toBe(false)
  })
})

describe('rng', () => {
  it('детермінований', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect([a.int(1, 100), a.int(1, 100), a.int(1, 100)]).toEqual([b.int(1, 100), b.int(1, 100), b.int(1, 100)])
  })
  it('межі та нуль', () => {
    const r = createRng(1)
    for (let i = 0; i < 500; i++) {
      const v = r.int(-3, 3)
      expect(v >= -3 && v <= 3).toBe(true)
      expect(r.nonZero(-3, 3)).not.toBe(0)
    }
    expect(new Set(r.ints(5, 1, 5, { distinct: true })).size).toBe(5)
  })
})

describe('progress', () => {
  const t = new Date('2026-10-20T10:00:00')
  it('накопичує володіння і ставить повторення', () => {
    let s = emptyProgress()
    for (let i = 0; i < 5; i++) s = applyAttempt(s, { topicId: 'x', skill: 's', correct: true, hintsUsed: 0, solutionShown: false }, t)
    expect(s.topics.x.mastery).toBeGreaterThan(0.8)
    expect(topicStatus(s.topics.x, t)).toBe('mastered')
    expect(s.topics.x.due).toBeTruthy()
    expect(dueTopicIds(s, t)).toEqual([])
    const later = new Date('2026-10-22T10:00:00')
    expect(dueTopicIds(s, later)).toEqual(['x'])
  })
  it('підказки та показане розв’язання знижують бал', () => {
    let a = emptyProgress()
    let b = emptyProgress()
    a = applyAttempt(a, { topicId: 'x', skill: 's', correct: true, hintsUsed: 0, solutionShown: false }, t)
    b = applyAttempt(b, { topicId: 'x', skill: 's', correct: true, hintsUsed: 2, solutionShown: false }, t)
    expect(a.topics.x.mastery).toBeGreaterThan(b.topics.x.mastery)
    const c = applyAttempt(emptyProgress(), { topicId: 'x', skill: 's', correct: true, hintsUsed: 0, solutionShown: true }, t)
    expect(c.topics.x.mastery).toBe(0)
    expect(c.topics.x.weakSkills?.s).toBe(1)
  })
  it('помилка на повторенні відкидає кошик', () => {
    let s = emptyProgress()
    for (let i = 0; i < 5; i++) s = applyAttempt(s, { topicId: 'x', skill: 's', correct: true, hintsUsed: 0, solutionShown: false }, t)
    const later = new Date('2026-10-22T10:00:00')
    s = applyAttempt(s, { topicId: 'x', skill: 's', correct: false, hintsUsed: 0, solutionShown: false }, later)
    expect(s.topics.x.box).toBe(0)
  })
  it('серія днів', () => {
    let s = emptyProgress()
    for (const d of ['2026-10-18T10:00:00', '2026-10-19T10:00:00', '2026-10-20T10:00:00'])
      s = applyAttempt(s, { topicId: 'x', skill: 's', correct: true, hintsUsed: 0, solutionShown: false }, new Date(d))
    expect(currentStreak(s, t)).toBe(3)
  })
})

describe('mdToPlain', () => {
  it('формули у простий текст', () => {
    expect(mdToPlain('$\\frac{a+b}{2}$')).toBe('(a+b)/2')
    expect(mdToPlain('$x^2 + y^{10}$')).toBe('x² + y¹⁰')
    expect(mdToPlain('$\\sqrt{x+1} \\le 3$')).toBe('√(x+1) ≤ 3')
    expect(mdToPlain('Це **важливо**: $\\angle ABC = 90^\\circ$')).toBe('Це важливо: ∠ABC = 90°')
    expect(mdToPlain('$\\begin{cases} x+y=3 \\\\ x-y=1 \\end{cases}$')).toContain('x+y=3')
    expect(mdToPlain('$a_1, a_n$')).toBe('a₁, aₙ')
  })
  it('не лишає зворотних скісних рисок для звичних команд', () => {
    const tex = '$\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha},\\quad \\alpha \\ne \\dfrac{\\pi}{2}+\\pi k$'
    expect(mdToPlain(tex)).not.toContain('\\')
  })
})
