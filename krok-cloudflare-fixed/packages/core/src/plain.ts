/**
 * Markdown+LaTeX → простий текст з Unicode. Потрібен Telegram-боту (і як запасний варіант),
 * де формули KaTeX відобразити не можна. Покриває шкільний набір команд.
 */

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ', x: 'ˣ', k: 'ᵏ', m: 'ᵐ', a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', t: 'ᵗ', y: 'ʸ' }
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', n: 'ₙ', i: 'ᵢ', k: 'ₖ', x: 'ₓ', a: 'ₐ', m: 'ₘ' }

const SYMBOLS: Record<string, string> = {
  cdot: '·', times: '×', div: ':', pm: '±', mp: '∓', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', equiv: '≡', sim: '∼', cong: '≅',
  infty: '∞', pi: 'π', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', varphi: 'φ', phi: 'φ', theta: 'θ', lambda: 'λ', mu: 'μ', sigma: 'σ', omega: 'ω', varepsilon: 'ε', epsilon: 'ε',
  angle: '∠', triangle: '△', parallel: '∥', perp: '⊥', circ: '°', degree: '°', cup: '∪', cap: '∩', in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', emptyset: '∅', varnothing: '∅',
  Rightarrow: '⇒', Leftrightarrow: '⇔', Leftarrow: '⇐', to: '→', rightarrow: '→', leftarrow: '←', leftrightarrow: '↔', forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨',
  sum: 'Σ', prod: 'Π', int: '∫', cdots: '…', ldots: '…', dots: '…', vdots: '⋮', therefore: '∴', because: '∵', overline: '', mathbb: '', mathrm: '', operatorname: '', mathbf: '', boldsymbol: '', displaystyle: '', limits: '',
  sin: 'sin', cos: 'cos', tan: 'tg', tg: 'tg', cot: 'ctg', ctg: 'ctg', arcsin: 'arcsin', arccos: 'arccos', arctan: 'arctg', arctg: 'arctg', arcctg: 'arcctg', ln: 'ln', lg: 'lg', log: 'log', lim: 'lim', max: 'max', min: 'min', gcd: 'НСД', exp: 'exp', sqrt: '√',
  quad: '  ', qquad: '    ', ',': ' ', ';': ' ', ':': ' ', '!': '', ' ': ' ', '{': '{', '}': '}', '|': '‖', '%': '%', '&': '&', '_': '_', '#': '#',
  cdotp: '·', bullet: '•', star: '★', neq_: '≠', lt: '<', gt: '>', prime: '′', vec: '', hat: '', bar: '', dot: '', tilde: '',
}

function scriptify(content: string, map: Record<string, string>, marker: string): string {
  if (content === '°' && marker === '^') return '°'
  const converted = [...content].map((c) => map[c])
  if (converted.every(Boolean)) return converted.join('')
  return content.length === 1 ? marker + content : `${marker}(${content})`
}

/** Знаходить фігурну групу {…} починаючи з позиції i (де s[i] === '{'); повертає [вміст, індекс після }]. */
function readGroup(s: string, i: number): [string, number] | null {
  if (s[i] !== '{') return null
  let depth = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++
    else if (s[j] === '}') {
      depth--
      if (depth === 0) return [s.slice(i + 1, j), j + 1]
    }
  }
  return null
}

function wrapIfComplex(s: string): string {
  return /^[\w.,°′]+$/.test(s) || /^\(.*\)$/.test(s) ? s : `(${s})`
}

export function texToPlain(tex: string): string {
  let s = tex
  // \begin{cases} ... \end{cases}
  s = s.replace(/\\begin\{(cases|array|aligned|align\*?|matrix|pmatrix)\}(\{[^}]*\})?([\s\S]*?)\\end\{\1\}/g, (_m, env, _cols, body: string) => {
    const rows = body.split(/\\\\/).map((r) => r.replace(/&/g, ' ').trim()).filter(Boolean)
    return env === 'cases' ? rows.map((r) => '⎨ ' + r).join('  ') : rows.join('; ')
  })
  s = s.replace(/\\left|\\right|\\big|\\Big|\\bigg/g, '')
  // \text{…}, \mathrm{…}
  s = s.replace(/\\(?:text|mathrm|textbf|operatorname|mathbf|boldsymbol|mathbb|mbox)\s*\{([^{}]*)\}/g, '$1')
  // \frac, \dfrac, \tfrac  (рекурсивно, бо можуть вкладатися)
  for (let guard = 0; guard < 20; guard++) {
    const m = s.match(/\\[dt]?frac\s*/)
    if (!m || m.index === undefined) break
    const start = m.index
    const a = readGroup(s, start + m[0].length)
    if (!a) break
    const b = readGroup(s, a[1])
    if (!b) break
    s = s.slice(0, start) + `${wrapIfComplex(texToPlain(a[0]))}/${wrapIfComplex(texToPlain(b[0]))}` + s.slice(b[1])
  }
  // \sqrt[n]{x}, \sqrt{x}
  for (let guard = 0; guard < 20; guard++) {
    const m = s.match(/\\sqrt\s*(\[([^\]]*)\])?\s*\{/)
    if (!m || m.index === undefined) break
    const gStart = m.index + m[0].length - 1
    const g = readGroup(s, gStart)
    if (!g) break
    const inner = texToPlain(g[0])
    const idx = m[2]
    const prefix = idx ? (idx === '3' ? '∛' : idx === '4' ? '∜' : scriptify(idx, SUP, '^') + '√') : '√'
    s = s.slice(0, m.index) + prefix + (/^[\w.]+$/.test(inner) ? inner : `(${inner})`) + s.slice(g[1])
  }
  s = s.replace(/\\sqrt\s*(\w)/g, '√$1')
  // \overline{AB} → AB̅ (просто AB), \vec{a} → a⃗
  s = s.replace(/\\(?:overline|bar)\s*\{([^{}]*)\}/g, '$1̅').replace(/\\vec\s*\{([^{}]*)\}/g, '$1⃗').replace(/\\hat\s*\{([^{}]*)\}/g, '$1')
  // степені та індекси
  s = s.replace(/\^\s*\{([^{}]*)\}/g, (_m, c: string) => scriptify(texToPlain(c), SUP, '^'))
  s = s.replace(/\^\s*(\\[a-zA-Z]+|[\w+-])/g, (_m, c: string) => scriptify(texToPlain(c), SUP, '^'))
  s = s.replace(/_\s*\{([^{}]*)\}/g, (_m, c: string) => scriptify(texToPlain(c), SUB, '_'))
  s = s.replace(/_\s*(\\[a-zA-Z]+|[\w])/g, (_m, c: string) => scriptify(texToPlain(c), SUB, '_'))
  // решта команд
  s = s.replace(/\\(angle|triangle|parallel|perp)\s+/g, (_m, name: string) => SYMBOLS[name])
  s = s.replace(/\\([a-zA-Z]+|[,;:!{}| %&_#])/g, (_m, name: string) => (name in SYMBOLS ? SYMBOLS[name] : name))
  s = s.replace(/\\\\/g, '\n')
  s = s.replace(/[{}]/g, '')
  s = s.replace(/[ \t]{2,}/g, ' ')
  return s.trim()
}

/** Markdown із $…$ / $$…$$ → простий текст. */
export function mdToPlain(md: string): string {
  let s = md
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_m, t: string) => '\n' + texToPlain(t) + '\n')
  s = s.replace(/\$([^$\n]+?)\$/g, (_m, t: string) => texToPlain(t))
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1')
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
  s = s.replace(/`([^`]+)`/g, '$1')
  return s.replace(/\n{3,}/g, '\n\n').trim()
}
