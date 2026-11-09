import { evalNumber, closeTo } from './expr'

export interface Interval {
  lo: number
  hi: number
  loInc: boolean
  hiInc: boolean
}

const EMPTY_RE = /^(∅|порожня множина|немає розв.язків|розв.язків немає|немає|нема|empty|\{\}|нет решений)$/i

function num(s: string): number | null {
  const t = s.trim().replace(/^\+/, '')
  if (/^(-?\s*(inf|infinity|∞|нескінченність))$/i.test(t)) return t.startsWith('-') ? -Infinity : Infinity
  return evalNumber(t)
}

/** Нормалізація: відсортувати, злити перетини та дотичні проміжки, нескінченності — відкриті. */
export function normalizeIntervals(list: Interval[]): Interval[] {
  const cleaned = list
    .map((i) => ({
      lo: i.lo,
      hi: i.hi,
      loInc: i.loInc && Number.isFinite(i.lo),
      hiInc: i.hiInc && Number.isFinite(i.hi),
    }))
    .filter((i) => i.lo < i.hi || (i.lo === i.hi && i.loInc && i.hiInc))
    .sort((a, b) => a.lo - b.lo || Number(b.loInc) - Number(a.loInc))
  const out: Interval[] = []
  for (const cur of cleaned) {
    const last = out[out.length - 1]
    if (last && (cur.lo < last.hi || (cur.lo === last.hi && (cur.loInc || last.hiInc)))) {
      if (cur.hi > last.hi || (cur.hi === last.hi && cur.hiInc)) {
        last.hi = cur.hi
        last.hiInc = cur.hiInc
      }
    } else out.push({ ...cur })
  }
  return out
}

function parseBracketInterval(piece: string): Interval | null {
  const m = piece.trim().match(/^([(\[\]])\s*([^;]+?)\s*;\s*([^;]+?)\s*([)\[\]])$/)
  if (!m) return null
  const lo = num(m[2])
  const hi = num(m[3])
  if (lo === null || hi === null) return null
  return { lo, hi, loInc: m[1] === '[', hiInc: m[4] === ']' }
}

/** Розбір нерівностей "x<=3", "-2<x<5", "x>1" на проміжок. */
function parseInequality(piece: string): Interval | null {
  const s = piece.replace(/\s+/g, '').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/−/g, '-').replace(/х/gi, 'x').replace(/=</g, '<=').replace(/=>/g, '>=')
  const parts = s.split(/(<=|>=|<|>)/)
  if (parts.length === 3) {
    const [l, op, r] = parts
    if (l.toLowerCase() === 'x') {
      const v = num(r)
      if (v === null) return null
      if (op === '<') return { lo: -Infinity, hi: v, loInc: false, hiInc: false }
      if (op === '<=') return { lo: -Infinity, hi: v, loInc: false, hiInc: true }
      if (op === '>') return { lo: v, hi: Infinity, loInc: false, hiInc: false }
      return { lo: v, hi: Infinity, loInc: true, hiInc: false }
    }
    if (r.toLowerCase() === 'x') {
      const v = num(l)
      if (v === null) return null
      // v < x  ⇒ x > v
      if (op === '<') return { lo: v, hi: Infinity, loInc: false, hiInc: false }
      if (op === '<=') return { lo: v, hi: Infinity, loInc: true, hiInc: false }
      if (op === '>') return { lo: -Infinity, hi: v, loInc: false, hiInc: false }
      return { lo: -Infinity, hi: v, loInc: false, hiInc: true }
    }
    return null
  }
  if (parts.length === 5 && parts[2].toLowerCase() === 'x') {
    const a = num(parts[0])
    const b = num(parts[4])
    const o1 = parts[1]
    const o2 = parts[3]
    if (a === null || b === null) return null
    if (o1.startsWith('<') && o2.startsWith('<')) return { lo: a, hi: b, loInc: o1 === '<=', hiInc: o2 === '<=' }
    if (o1.startsWith('>') && o2.startsWith('>')) return { lo: b, hi: a, loInc: o2 === '>=', hiInc: o1 === '>=' }
  }
  return null
}

/** Розбирає відповідь-проміжок. Повертає null, якщо не розпізнано; [] — порожня множина. */
export function parseIntervals(input: string): Interval[] | null {
  let s = input.trim()
  if (EMPTY_RE.test(s)) return []
  s = s.replace(/^x\s*(∈|є|in)\s*/i, '').replace(/^х\s*(∈|є)\s*/i, '')
  s = s.replace(/[−–—]/g, '-').replace(/([)\]])\s*u\s*([(\[])/gi, '$1∪$2')
  const pieces = s.split(/∪|\s+або\s+|\s+or\s+|\bU\b/).map((p) => p.trim()).filter(Boolean)
  if (pieces.length === 0) return null
  const result: Interval[] = []
  for (const p of pieces) {
    const single = p.match(/^\{\s*([^{};]+?)\s*\}$/)
    if (single) {
      const v = num(single[1])
      if (v === null) return null
      result.push({ lo: v, hi: v, loInc: true, hiInc: true })
      continue
    }
    const it = parseBracketInterval(p) ?? parseInequality(p)
    if (!it) return null
    result.push(it)
  }
  return normalizeIntervals(result)
}

export function intervalsEqual(a: Interval[], b: Interval[]): boolean {
  if (a.length !== b.length) return false
  return a.every((x, i) => {
    const y = b[i]
    const same = (p: number, q: number) => (Number.isFinite(p) && Number.isFinite(q) ? closeTo(p, q) : p === q)
    return same(x.lo, y.lo) && same(x.hi, y.hi) && x.loInc === y.loInc && x.hiInc === y.hiInc
  })
}
