/**
 * Перевірка контенту:  npm run validate            — усі теми
 *                       npm run validate -- a8-quad-formula g7-angles   — вибрані
 * Перевіряє: генератори (багато seed), власні відповіді, структуру, LaTeX (KaTeX), підозрілі керівні символи.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'
import { execFileSync } from 'node:child_process'
import { createRng, isReady, validateSubjects, validateTopic, mdToPlain, type Problem, type Topic, type Block } from '@krok/core'

const here = dirname(fileURLToPath(import.meta.url))
execFileSync('npx', ['tsx', join(here, 'gen-index.ts')], { stdio: 'ignore' })
const { subjects, topicIndex } = await import('@krok/content')

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const seeds = Number(process.env.SEEDS ?? 40)
let problems = 0
const out = (id: string, where: string, msg: string) => {
  problems++
  console.log(`✗ ${id} [${where}] ${msg}`)
}

// 1) Сирцеві файли: одинарні зворотні скісні риски в рядках — типова помилка (\f у \frac стає символом форми)
const root = join(here, '..', 'packages', 'content', 'src')
for (const s of subjects) {
  for (const g of readdirSync(join(root, s.id), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const f of readdirSync(join(root, s.id, g.name)).filter((f) => f.endsWith('.topic.ts'))) {
      const id = f.replace('.topic.ts', '')
      if (only.length && !only.includes(id)) continue
      const src = readFileSync(join(root, s.id, g.name, f), 'utf8')
      const code = src.split('\n')
      code.forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return
        const m = line.match(/(?<!\\)\\(?![\\n`'"$u])[A-Za-z]/)
        if (m) out(id, `${f}:${i + 1}`, `одинарний «\\» перед літерою (потрібно «\\\\»): …${line.trim().slice(Math.max(0, (m.index ?? 0) - 15), (m.index ?? 0) + 25)}…`)
      })
      const t = topicIndex.get(id)
      if (!t) out(id, f, `id теми немає в карті програми (curriculum.ts) — файл ${f} має дорівнювати id`)
    }
  }
}

// 2) Структура та генератори
const all = subjects.flatMap((s) => s.topics)
const targets: Topic[] = only.length ? all.filter((t) => only.includes(t.id)) : all
for (const id of only) if (!topicIndex.has(id)) out(id, '-', 'такої теми немає в карті')
for (const t of targets) {
  if (!isReady(t)) {
    if (only.length) out(t.id, 'topic', 'тема — заготовка (немає файлу <id>.topic.ts, або порожні lesson/exercises)')
    continue
  }
  for (const p of t.prereqs) if (!topicIndex.has(p)) out(t.id, 'prereqs', `невідома передумова ${p}`)
  for (const i of validateTopic(t, seeds)) out(i.topicId, i.where, i.message)
}
if (!only.length) for (const i of validateSubjects(subjects, 0).filter((i) => i.where !== 'lesson' && !/exercises|examples/.test(i.where))) out(i.topicId, i.where, i.message)

// 3) KaTeX: усі $…$ у теорії та у згенерованих задачах
function texPieces(md: string): string[] {
  const res: string[] = []
  md.replace(/\$\$([\s\S]+?)\$\$/g, (_m, t) => (res.push(t), ''))
    .replace(/\$([^$\n]+?)\$/g, (_m, t) => (res.push(t), ''))
  return res
}
function checkTex(id: string, where: string, md: string) {
  if (/[\u0000-\u0008\u000b-\u001f]/.test(md)) out(id, where, `керівний символ у тексті (схоже, \\frac/\\text написано з одним «\\»): ${JSON.stringify(md.slice(0, 50))}`)
  for (const t of texPieces(md)) {
    try {
      katex.renderToString(t, { throwOnError: true, strict: 'ignore', displayMode: false })
    } catch (e) {
      out(id, where, `KaTeX: ${(e as Error).message.split('\n')[0]} у «${t.slice(0, 70)}»`)
    }
  }
  const plain = mdToPlain(md)
  if (/\\[a-zA-Z]+/.test(plain)) out(id, where, `у простому тексті лишилась LaTeX-команда (бот): ${plain.match(/\\[a-zA-Z]+/)![0]}`)
}
function blockTexts(b: Block): string[] {
  switch (b.type) {
    case 'text': case 'intuition': case 'warning': case 'tip': return [b.md]
    case 'definition': return [b.term, b.md]
    case 'rule': return [b.title ?? '', b.md]
    case 'algorithm': return [b.title, ...b.steps]
    case 'check': return [b.question, b.answer, b.explain ?? '']
    case 'figure': return [b.figure.caption ?? '']
  }
}
for (const t of targets) {
  if (!isReady(t)) continue
  t.lesson.forEach((s, i) => s.blocks.forEach((b, j) => blockTexts(b).forEach((x) => checkTex(t.id, `lesson[${i}].${j}:${b.type}`, x))))
  t.examples.forEach((e, i) => {
    checkTex(t.id, `example[${i}]`, [e.problem, e.answer, ...e.steps.flatMap((s) => [s.think ?? '', s.do])].join('\n'))
  })
  t.formulas?.forEach((f, i) => checkTex(t.id, `formula[${i}]`, `${f.title} $${f.tex}$ ${f.note ?? ''}`))
  t.mistakes?.forEach((m, i) => checkTex(t.id, `mistake[${i}]`, [m.wrong, m.why, m.right].join('\n')))
  for (const tpl of t.exercises) {
    for (let k = 0; k < 12; k++) {
      let p: Problem
      try {
        p = tpl.generate(createRng(5000 + k * 104729))
      } catch {
        continue // про це вже написав validateTopic
      }
      const texts = [p.prompt, ...p.hints, ...p.solution, p.answerTex ? `$${p.answerTex}$` : '', ...(p.steps ?? []).flatMap((s) => [s.prompt, s.explanation, s.hint ?? ''])]
      for (const x of texts) checkTex(t.id, `${tpl.id}#${k}`, x)
      if (p.answer.kind === 'choice') p.answer.options.forEach((o) => checkTex(t.id, `${tpl.id}#${k}:option`, o))
      if (problems > 60) break
    }
    if (problems > 60) break
  }
}

const ready = all.filter(isReady).length
console.log(problems === 0 ? `✓ все гаразд: перевірено ${targets.filter(isReady).length} тем (усього готових: ${ready}/${all.length})` : `\nЗнайдено проблем: ${problems}`)
process.exit(problems === 0 ? 0 : 1)
