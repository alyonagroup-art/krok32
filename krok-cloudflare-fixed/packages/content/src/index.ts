import type { Subject, Topic } from '@krok/core'
import { indexTopics } from '@krok/core'
import { mergeCurriculum } from './lib/skeleton'
import { authored } from './generated'
import { chapters as algebraChapters, skeleton as algebraSkeleton } from './algebra/curriculum'
import { chapters as geometryChapters, skeleton as geometrySkeleton } from './geometry/curriculum'

export * from './lib'

/**
 * Реєстр предметів. Щоб додати новий предмет (фізика, хімія…):
 * 1) створи папку src/<предмет>/ з curriculum.ts (розділи + карта тем) та g<клас>/*.topic.ts;
 * 2) запусти `npm run gen`;
 * 3) додай рядок у масив нижче.
 */
export const subjects: Subject[] = [
  {
    id: 'algebra',
    title: 'Алгебра',
    icon: '𝑥²',
    description: 'Від виразів і рівнянь 7 класу — до тригонометрії та похідної у 10-му.',
    grades: [6, 7, 8, 9, 10],
    color: '#2b4fd8',
    chapters: algebraChapters,
    topics: mergeCurriculum('algebra', algebraSkeleton, authored.algebra ?? []),
  },
  {
    id: 'geometry',
    title: 'Геометрія',
    icon: '△',
    description: 'Від кутів і трикутників — до стереометрії та векторів у просторі.',
    grades: [6, 7, 8, 9, 10],
    color: '#0e8a6a',
    chapters: geometryChapters,
    topics: mergeCurriculum('geometry', geometrySkeleton, authored.geometry ?? []),
  },
]

export const topicIndex: Map<string, Topic> = indexTopics(subjects)
export const getSubject = (id: string): Subject | undefined => subjects.find((s) => s.id === id)
export const getTopic = (id: string): Topic | undefined => topicIndex.get(id)
