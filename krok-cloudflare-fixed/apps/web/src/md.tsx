import katex from 'katex'

/**
 * Мінімальний markdown + KaTeX: абзаци, списки (- і 1.), **жирний**, *курсив*, `код`, $…$ та $$…$$.
 * Контент пишемо ми самі, але текст усе одно екранується.
 */

const cache = new Map<string, string>()

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function renderTex(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' })
  } catch {
    return `<code>${esc(tex)}</code>`
  }
}

function inline(text: string): string {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function mdToHtml(md: string, inlineOnly = false): string {
  const key = (inlineOnly ? 'i:' : 'b:') + md
  const hit = cache.get(key)
  if (hit) return hit
  const maths: string[] = []
  const stash = (html: string) => {
    maths.push(html)
    return `\u0001${maths.length - 1}\u0002`
  }
  let s = md.replace(/\$\$([\s\S]+?)\$\$/g, (_m, t: string) => stash(renderTex(t.trim(), true)))
  s = s.replace(/\$([^$\n]+?)\$/g, (_m, t: string) => stash(renderTex(t.trim(), false)))

  let html: string
  if (inlineOnly) {
    html = inline(s).replace(/\n/g, '<br>')
  } else {
    const blocks = s.split(/\n{2,}/)
    html = blocks
      .map((block) => {
        const lines = block.split('\n')
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('')}</ul>`
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`
        // змішаний блок: «рядок + список»
        if (lines.some((l) => /^\s*[-•]\s+/.test(l))) {
          let out = ''
          let list: string[] = []
          const flush = () => {
            if (list.length) out += `<ul>${list.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`
            list = []
          }
          let para: string[] = []
          const flushPara = () => {
            if (para.length) out += `<p>${inline(para.join('\n')).replace(/\n/g, '<br>')}</p>`
            para = []
          }
          for (const l of lines) {
            if (/^\s*[-•]\s+/.test(l)) {
              flushPara()
              list.push(l.replace(/^\s*[-•]\s+/, ''))
            } else {
              flush()
              para.push(l)
            }
          }
          flush()
          flushPara()
          return out
        }
        return `<p>${inline(block).replace(/\n/g, '<br>')}</p>`
      })
      .join('')
  }
  html = html.replace(/\u0001(\d+)\u0002/g, (_m, i: string) => maths[Number(i)])
  if (cache.size > 3000) cache.clear()
  cache.set(key, html)
  return html
}

export function Md({ text, inline = false, className }: { text: string; inline?: boolean; className?: string }) {
  const html = mdToHtml(text, inline)
  const Tag = inline ? 'span' : 'div'
  return <Tag className={`md ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />
}

export function Tex({ tex, display = false }: { tex: string; display?: boolean }) {
  return <span dangerouslySetInnerHTML={{ __html: renderTex(tex, display) }} />
}
