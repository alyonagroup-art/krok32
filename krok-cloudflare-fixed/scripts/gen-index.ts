/**
 * Сканує packages/content/src/<subject>/g<grade>/*.topic.ts та генерує generated.ts,
 * щоб автори тем не редагували спільний індекс (немає конфліктів).
 */
import { readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'content', 'src')
const subjects = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(root, d.name, 'curriculum.ts'))).map((d) => d.name)

const lines: string[] = ['// АВТОГЕНЕРОВАНО: npm run gen. Не редагуйте вручну.', "import type { Topic } from '@krok/core'"]
const groups: Record<string, string[]> = {}
let n = 0
for (const s of subjects) {
  groups[s] = []
  for (const g of readdirSync(join(root, s), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
    for (const f of readdirSync(join(root, s, g)).filter((f) => f.endsWith('.topic.ts')).sort()) {
      const name = `t${n++}`
      lines.push(`import ${name} from './${s}/${g}/${f.replace(/\.ts$/, '')}'`)
      groups[s].push(name)
    }
  }
}
lines.push('', 'export const authored: Record<string, Topic[]> = {')
for (const s of subjects) lines.push(`  ${s}: [${groups[s].join(', ')}],`)
lines.push('}', '')
writeFileSync(join(root, 'generated.ts'), lines.join('\n'))
console.log(`generated.ts: ${n} topic files in ${subjects.length} subjects`)
