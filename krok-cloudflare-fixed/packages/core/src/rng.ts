import type { Rng } from './types'

/** mulberry32 — маленький швидкий детермінований генератор. */
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

/** Створює генератор. Той самий seed → та сама задача (корисно для повторів і тестів). */
export function createRng(seed: number | string = randomSeed()): Rng {
  const s = typeof seed === 'string' ? hashString(seed) : seed | 0
  const raw = mulberry32(s)
  const rng: Rng = {
    seed: s,
    next: raw,
    int(min, max) {
      if (max < min) throw new Error(`rng.int: max (${max}) < min (${min})`)
      return min + Math.floor(raw() * (max - min + 1))
    },
    nonZero(min, max) {
      if (min === 0 && max === 0) throw new Error('rng.nonZero: only zero available')
      for (let i = 0; i < 1000; i++) {
        const v = rng.int(min, max)
        if (v !== 0) return v
      }
      return min === 0 ? 1 : min
    },
    pick(items) {
      if (items.length === 0) throw new Error('rng.pick: empty array')
      return items[Math.floor(raw() * items.length)]
    },
    shuffle(items) {
      const a = [...items]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(raw() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
    sign() {
      return raw() < 0.5 ? -1 : 1
    },
    chance(p) {
      return raw() < p
    },
    ints(n, min, max, opts) {
      if (opts?.distinct) {
        if (max - min + 1 < n) throw new Error('rng.ints: range too small for distinct values')
        const pool: number[] = []
        for (let v = min; v <= max; v++) pool.push(v)
        return rng.shuffle(pool).slice(0, n)
      }
      return Array.from({ length: n }, () => rng.int(min, max))
    },
  }
  return rng
}
