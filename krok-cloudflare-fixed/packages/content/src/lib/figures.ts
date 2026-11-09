import type { Figure, FigureItem } from '@krok/core'

type P = [number, number]

/** Рамка з відступом навколо точок: [xmin, ymin, xmax, ymax]. Зберігає пропорції (щоб кола були колами). */
export function fitView(points: P[], pad = 0.18, minSize = 1): [number, number, number, number] {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  let x0 = Math.min(...xs)
  let x1 = Math.max(...xs)
  let y0 = Math.min(...ys)
  let y1 = Math.max(...ys)
  const w = Math.max(x1 - x0, minSize)
  const h = Math.max(y1 - y0, minSize)
  const px = w * pad
  const py = h * pad
  x0 -= px
  x1 += px
  y0 -= py
  y1 += py
  return [x0, y0, x1, y1]
}

/** Швидко зібрати малюнок: точки → автоматичний view. */
export function figure(points: Record<string, P>, items: FigureItem[], opts: Partial<Figure> & { extra?: P[] } = {}): Figure {
  const { extra, ...rest } = opts
  const all = [...Object.values(points), ...(extra ?? [])]
  return { view: fitView(all), points, items, ...rest }
}

/** Точка на відстані r від (cx, cy) у напрямку deg градусів (проти годинникової від осі x). */
export function polar(cx: number, cy: number, r: number, deg: number): P {
  const t = (deg * Math.PI) / 180
  return [cx + r * Math.cos(t), cy + r * Math.sin(t)]
}

/** Трикутник за трьома сторонами: A=(0,0), B=(c,0), C зверху. a=BC, b=CA, c=AB. Кидає помилку, якщо не існує. */
export function triangleFromSides(a: number, b: number, c: number): { A: P; B: P; C: P } {
  const cosA = (b * b + c * c - a * a) / (2 * b * c)
  if (Math.abs(cosA) >= 1) throw new Error(`triangleFromSides: no triangle with sides ${a}, ${b}, ${c}`)
  const sinA = Math.sqrt(1 - cosA * cosA)
  return { A: [0, 0], B: [c, 0], C: [b * cosA, b * sinA] }
}

/** Повернути точку p навколо центра c на deg градусів. */
export function rotate(p: P, c: P, deg: number): P {
  const t = (deg * Math.PI) / 180
  const dx = p[0] - c[0]
  const dy = p[1] - c[1]
  return [c[0] + dx * Math.cos(t) - dy * Math.sin(t), c[1] + dx * Math.sin(t) + dy * Math.cos(t)]
}

export const dist = (p: P, q: P): number => Math.hypot(p[0] - q[0], p[1] - q[1])
export const mid = (p: P, q: P): P => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
