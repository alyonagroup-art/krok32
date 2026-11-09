import { useId, useMemo } from 'react'
import type { Figure, FigureItem, PointRef } from '@krok/core'
import { compileExpr, evalAt } from '@krok/core'
import { Md } from '../md'

const COLORS: Record<string, string> = {
  ink: 'var(--fig-ink)',
  red: 'var(--fig-red)',
  green: 'var(--fig-green)',
  orange: 'var(--fig-orange)',
  violet: 'var(--fig-violet)',
  gray: 'var(--fig-gray)',
}
const col = (c?: string) => COLORS[c ?? 'ink'] ?? COLORS.ink

type P = [number, number]

function niceStep(range: number, target = 10): number {
  const raw = range / target
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / pow
  const m = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10
  return m * pow
}

const fmt = (v: number) => String(Math.round(v * 1000) / 1000).replace('-', '−').replace('.', ',')

export function FigureView({ figure }: { figure: Figure }) {
  const uid = useId().replace(/:/g, '')
  const [x0, y0, x1, y1] = figure.view
  const W = figure.width ?? 360
  const s = W / (x1 - x0)
  const H = (y1 - y0) * s
  const px = (x: number) => (x - x0) * s
  const py = (y: number) => (y1 - y) * s
  const pts = figure.points ?? {}
  const resolve = (r: PointRef): P => (typeof r === 'string' ? pts[r] ?? [0, 0] : r)
  const to = (r: PointRef): P => {
    const [x, y] = resolve(r)
    return [px(x), py(y)]
  }

  // центр фігури — для вибору напрямку підписів точок
  const named = Object.values(pts)
  const cx = named.length ? named.reduce((a, p) => a + p[0], 0) / named.length : (x0 + x1) / 2
  const cy = named.length ? named.reduce((a, p) => a + p[1], 0) / named.length : (y0 + y1) / 2

  const axesOpt = figure.axes === true ? { grid: true, ticks: true } : figure.axes || null
  const showAxes = !!axesOpt

  const plots = useMemo(() => {
    const res = new Map<number, { d: string; holes: P[] }>()
    figure.items?.forEach((it, idx) => {
      if (it.t !== 'plot') return
      const node = compileExpr(it.expr)
      if (!node) return
      const [dx0, dx1] = it.domain ?? [x0, x1]
      const N = 480
      let d = ''
      let pen = false
      let prevY = NaN
      for (let i = 0; i <= N; i++) {
        const x = dx0 + ((dx1 - dx0) * i) / N
        const y = evalAt(node, { x })
        const bad = !Number.isFinite(y) || Math.abs(y) > 1e4 || (Number.isFinite(prevY) && Math.abs(y - prevY) > (y1 - y0) * 3)
        if (bad) {
          pen = false
        } else {
          d += `${pen ? 'L' : 'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`
          pen = true
        }
        prevY = bad ? NaN : y
      }
      const holes: P[] = (it.holes ?? []).map((hx) => {
        const hy = (evalAt(node, { x: hx - 1e-4 }) + evalAt(node, { x: hx + 1e-4 })) / 2
        return [px(hx), py(hy)] as P
      })
      res.set(idx, { d, holes })
    })
    return res
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figure])

  const gridLines: JSX.Element[] = []
  if (showAxes) {
    const step = niceStep(Math.max(x1 - x0, y1 - y0), 10)
    const grid = typeof axesOpt === 'object' ? axesOpt.grid !== false : true
    const ticks = typeof axesOpt === 'object' ? axesOpt.ticks !== false : true
    if (grid) {
      for (let x = Math.ceil(x0 / step) * step; x <= x1 + 1e-9; x += step)
        gridLines.push(<line key={`gx${x}`} x1={px(x)} x2={px(x)} y1={0} y2={H} className="fig-grid" />)
      for (let y = Math.ceil(y0 / step) * step; y <= y1 + 1e-9; y += step)
        gridLines.push(<line key={`gy${y}`} x1={0} x2={W} y1={py(y)} y2={py(y)} className="fig-grid" />)
    }
    const ax = Math.min(Math.max(0, x0), x1)
    const ay = Math.min(Math.max(0, y0), y1)
    gridLines.push(<line key="axx" x1={0} x2={W} y1={py(ay)} y2={py(ay)} className="fig-axis" markerEnd={`url(#arr-${uid})`} />)
    gridLines.push(<line key="axy" x1={px(ax)} x2={px(ax)} y1={H} y2={0} className="fig-axis" markerEnd={`url(#arr-${uid})`} />)
    if (ticks) {
      for (let x = Math.ceil(x0 / step) * step; x <= x1 + 1e-9; x += step) {
        if (Math.abs(x) < 1e-9 || x > x1 - step * 0.3) continue
        gridLines.push(
          <text key={`tx${x}`} x={px(x)} y={Math.min(H - 2, py(ay) + 13)} textAnchor="middle" className="fig-tick">
            {fmt(x)}
          </text>,
        )
      }
      for (let y = Math.ceil(y0 / step) * step; y <= y1 + 1e-9; y += step) {
        if (Math.abs(y) < 1e-9 || y > y1 - step * 0.3) continue
        gridLines.push(
          <text key={`ty${y}`} x={Math.max(2, px(ax) - 5)} y={py(y) + 4} textAnchor="end" className="fig-tick">
            {fmt(y)}
          </text>,
        )
      }
      if (ay === 0 && ax === 0) gridLines.push(<text key="o" x={px(0) - 5} y={py(0) + 13} textAnchor="end" className="fig-tick">0</text>)
    }
    const xl = typeof axesOpt === 'object' ? axesOpt.xLabel ?? 'x' : 'x'
    const yl = typeof axesOpt === 'object' ? axesOpt.yLabel ?? 'y' : 'y'
    gridLines.push(<text key="xl" x={W - 4} y={py(ay) - 6} textAnchor="end" className="fig-axis-label">{xl}</text>)
    gridLines.push(<text key="yl" x={px(ax) + 7} y={12} className="fig-axis-label">{yl}</text>)
  }

  const renderItem = (it: FigureItem, i: number) => {
    switch (it.t) {
      case 'seg': {
        const [ax, ay] = to(it.a)
        const [bx, by] = to(it.b)
        const stroke = col(it.color)
        const els: JSX.Element[] = [
          <line key="l" x1={ax} y1={ay} x2={bx} y2={by} stroke={stroke} strokeWidth={it.style === 'bold' ? 3.2 : 1.9} strokeDasharray={it.style === 'dashed' ? '6 5' : undefined} strokeLinecap="round" />,
        ]
        const mx = (ax + bx) / 2
        const my = (ay + by) / 2
        const len = Math.hypot(bx - ax, by - ay) || 1
        const nx = -(by - ay) / len
        const ny = (bx - ax) / len
        const tx = (bx - ax) / len
        const ty = (by - ay) / len
        for (let k = 0; k < (it.ticks ?? 0); k++) {
          const off = (k - ((it.ticks ?? 1) - 1) / 2) * 5
          els.push(<line key={`t${k}`} x1={mx + tx * off + nx * 5} y1={my + ty * off + ny * 5} x2={mx + tx * off - nx * 5} y2={my + ty * off - ny * 5} stroke={stroke} strokeWidth={1.6} />)
        }
        if (it.label) {
          const side = it.labelSide ?? 1
          els.push(<text key="lab" x={mx + nx * 13 * side} y={my + ny * 13 * side + 4} textAnchor="middle" className="fig-label" fill={stroke}>{it.label}</text>)
        }
        return <g key={i}>{els}</g>
      }
      case 'line': {
        const [ax, ay] = resolve(it.a)
        const [bx, by] = resolve(it.b)
        const dx = bx - ax
        const dy = by - ay
        const L = Math.max(x1 - x0, y1 - y0) * 3
        const n = Math.hypot(dx, dy) || 1
        return <line key={i} x1={px(ax - (dx / n) * L)} y1={py(ay - (dy / n) * L)} x2={px(ax + (dx / n) * L)} y2={py(ay + (dy / n) * L)} stroke={col(it.color)} strokeWidth={1.9} strokeDasharray={it.style === 'dashed' ? '6 5' : undefined} clipPath={`url(#clip-${uid})`} />
      }
      case 'arrow': {
        const [ax, ay] = to(it.a)
        const [bx, by] = to(it.b)
        const c = col(it.color)
        return (
          <g key={i}>
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke={c} strokeWidth={2.2} markerEnd={`url(#arrh-${uid}-${it.color ?? 'ink'})`} />
            {it.label && <text x={(ax + bx) / 2 + 8} y={(ay + by) / 2 - 8} className="fig-label" fill={c}>{it.label}</text>}
          </g>
        )
      }
      case 'poly': {
        const d = it.pts.map((p, k) => `${k ? 'L' : 'M'}${to(p).join(',')}`).join('') + 'Z'
        return <path key={i} d={d} fill={it.fill ? col(it.fill) : 'none'} fillOpacity={it.fill ? 0.16 : 0} stroke={it.stroke === false ? 'none' : col(it.color)} strokeWidth={1.9} strokeLinejoin="round" strokeDasharray={it.dashed ? '6 5' : undefined} />
      }
      case 'circle': {
        const [ccx, ccy] = to(it.c)
        return <circle key={i} cx={ccx} cy={ccy} r={it.r * s} fill={it.fill ? col(it.fill) : 'none'} fillOpacity={it.fill ? 0.14 : 0} stroke={col(it.color)} strokeWidth={1.9} strokeDasharray={it.dashed ? '6 5' : undefined} />
      }
      case 'angle': {
        const [ox, oy] = resolve(it.at)
        const [fx, fy] = resolve(it.from)
        const [tx, ty] = resolve(it.to)
        const a1 = Math.atan2(fy - oy, fx - ox)
        const a2 = Math.atan2(ty - oy, tx - ox)
        let delta = a2 - a1
        while (delta < 0) delta += 2 * Math.PI
        while (delta >= 2 * Math.PI) delta -= 2 * Math.PI
        const r = (it.r ?? 0.5) * s
        const c = col(it.color)
        const O: P = [px(ox), py(oy)]
        const els: JSX.Element[] = []
        if (it.right || Math.abs(delta - Math.PI / 2) < 1e-6 && it.right !== false && !it.label) {
          const k = Math.min(r, 16) * 0.75 + 4
          const u: P = [Math.cos(a1), -Math.sin(a1)]
          const v: P = [Math.cos(a2), -Math.sin(a2)]
          const A: P = [O[0] + u[0] * k, O[1] + u[1] * k]
          const B: P = [O[0] + v[0] * k, O[1] + v[1] * k]
          const Cc: P = [A[0] + v[0] * k, A[1] + v[1] * k]
          els.push(<path key="sq" d={`M${A.join(',')}L${Cc.join(',')}L${B.join(',')}`} fill="none" stroke={c} strokeWidth={1.6} />)
        } else {
          const arcs = it.arcs ?? 1
          for (let k = 0; k < arcs; k++) {
            const rr = r + k * 4
            const sx = O[0] + rr * Math.cos(a1)
            const sy = O[1] - rr * Math.sin(a1)
            const ex = O[0] + rr * Math.cos(a1 + delta)
            const ey = O[1] - rr * Math.sin(a1 + delta)
            els.push(<path key={`a${k}`} d={`M${sx},${sy}A${rr},${rr} 0 ${delta > Math.PI ? 1 : 0} 0 ${ex},${ey}`} fill="none" stroke={c} strokeWidth={1.7} />)
          }
        }
        if (it.label) {
          const am = a1 + delta / 2
          const lr = r + 14 + ((it.arcs ?? 1) - 1) * 4 + Math.min(it.label.length, 8) * 1.6
          els.push(<text key="lab" x={O[0] + lr * Math.cos(am)} y={O[1] - lr * Math.sin(am) + 4} textAnchor="middle" className="fig-label" fill={c}>{it.label}</text>)
        }
        return <g key={i}>{els}</g>
      }
      case 'dot': {
        const [dx, dy] = to(it.at)
        return <circle key={i} cx={dx} cy={dy} r={3.6} fill={it.hollow ? 'var(--paper)' : col(it.color)} stroke={col(it.color)} strokeWidth={1.8} />
      }
      case 'text': {
        const [tx, ty] = to(it.at)
        return <text key={i} x={tx} y={ty} className="fig-label" fill={col(it.color)} fontSize={it.size ?? 14}>{it.text}</text>
      }
      case 'tickmark': {
        const [tx, ty] = to(it.at)
        return <path key={i} d={`M${tx - 4},${ty - 4}L${tx + 4},${ty + 4}M${tx - 4},${ty + 4}L${tx + 4},${ty - 4}`} stroke={col(it.color)} strokeWidth={1.8} />
      }
      case 'plot': {
        const pl = plots.get(i)
        if (!pl) return null
        return (
          <g key={i} clipPath={`url(#clip-${uid})`}>
            <path d={pl.d} fill="none" stroke={col(it.color)} strokeWidth={2.4} strokeLinejoin="round" strokeDasharray={it.dashed ? '7 5' : undefined} />
            {pl.holes.map((h, k) => <circle key={k} cx={h[0]} cy={h[1]} r={3.8} fill="var(--paper)" stroke={col(it.color)} strokeWidth={1.8} />)}
          </g>
        )
      }
    }
  }

  const hidden = new Set(figure.hideLabels ?? [])
  const labels = Object.entries(pts)
    .filter(([name]) => !hidden.has(name))
    .map(([name, [x, y]]) => {
      const off = figure.labelOffsets?.[name]
      let dx: number
      let dy: number
      if (off) [dx, dy] = off
      else {
        const vx = px(x) - px(cx)
        const vy = py(y) - py(cy)
        const n = Math.hypot(vx, vy) || 1
        dx = (vx / n) * 14
        dy = (vy / n) * 14
      }
      return (
        <text key={name} x={px(x) + dx} y={py(y) + dy + 5} textAnchor="middle" className="fig-point">
          {name}
        </text>
      )
    })

  const arrowColors = [...new Set((figure.items ?? []).filter((it) => it.t === 'arrow').map((it) => (it as { color?: string }).color ?? 'ink'))]

  return (
    <figure className="figure">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} style={{ maxWidth: '100%', height: 'auto' }} role="img" aria-label={figure.caption ? figure.caption.replace(/\$/g, '') : 'Малюнок'}>
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x={0} y={0} width={W} height={H} />
          </clipPath>
          <marker id={`arr-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,1L9,5L0,9" fill="none" stroke="var(--fig-axis)" strokeWidth="1.4" />
          </marker>
          {arrowColors.map((c) => (
            <marker key={c} id={`arrh-${uid}-${c}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,1L9,5L0,9Z" fill={col(c)} />
            </marker>
          ))}
        </defs>
        {gridLines}
        <g>{figure.items?.map(renderItem)}</g>
        {labels}
      </svg>
      {figure.caption && (
        <figcaption>
          <Md text={figure.caption} inline />
        </figcaption>
      )}
    </figure>
  )
}
