/**
 * The whole school schedule lives in this file — edit it here, nothing else.
 *
 * Model
 * -----
 * · Students follow a 7-period day (plus homeroom), with three staggered lunch shifts.
 * · Every day is either an "A day" or a "B day"; A days and B days take different courses.
 * · The A/B *week* decides which weekdays are which kind of day:
 *     A week → Mon/Wed/Fri are A days, Tue/Thu are B days
 *     B week → Mon/Wed/Fri are B days, Tue/Thu are A days
 * · Choosing a lunch shift re-times the whole midday block for that student.
 * · Anchor Time is a 25-minute support block that runs right after first period.
 * · The day runs 8:00 AM – 2:40 PM, whichever lunch shift a student picks.
 */
import type { LunchId, LunchOption, ScheduleBlock, Week, WeekdayIndex } from '../types'
import { toMinutes } from '../lib/time'
import { weekForDate } from './calendar'

export const SCHOOL = {
  name: 'Minnetonka High School',
  year: '2026–27',
}

export const LUNCHES: readonly LunchOption[] = [
  { id: 'lunch1', name: 'Lunch 1', detail: 'Early shift · Cafeteria A' },
  { id: 'lunch2', name: 'Lunch 2', detail: 'Middle shift · Cafeteria A' },
  { id: 'lunch3', name: 'Lunch 3', detail: 'Late shift · Cafeteria B' },
]

type CourseRow = readonly [title: string, teacher: string, room: string]

/** Periods 1–7 for each kind of day. Add electives or swap teachers freely. */
const DAY_COURSES: Record<Week, readonly CourseRow[]> = {
  A: [
    ['Algebra II', 'Ms. Rivera', 'Rm 204'],
    ['English 10', 'Mr. Okafor', 'Rm 118'],
    ['Chemistry', 'Dr. Patel', 'Lab 3'],
    ['World History', 'Ms. Lin', 'Rm 210'],
    ['Spanish II', 'Sr. Alvarado', 'Rm 136'],
    ['A/V Production', 'Mr. Boone', 'Studio 1'],
    ['Physical Education', 'Coach Ruiz', 'Main Gym'],
  ],
  B: [
    ['Geometry', 'Ms. Rivera', 'Rm 204'],
    ['Creative Writing', 'Mr. Okafor', 'Rm 118'],
    ['Physics', 'Dr. Patel', 'Lab 2'],
    ['Civics', 'Ms. Lin', 'Rm 210'],
    ['French I', 'Mme. Duval', 'Rm 140'],
    ['Robotics', 'Ms. Wang', 'Makerspace'],
    ['Health', 'Nurse Adeyemi', 'Rm 101'],
  ],
}

const HOMEROOM: CourseRow = ['Advisory', 'Ms. Chen', 'Rm 204']
const WEDNESDAY_ADVISORY: CourseRow = ['Study Hall', 'Ms. Chen', 'Library']

type SlotKey = 'HR' | 'ANCHOR' | 'LUNCH' | `P${1 | 2 | 3 | 4 | 5 | 6 | 7}`
type Slot = readonly [key: SlotKey, start: string, end: string]

/**
 * Bell times per lunch shift for the 8:00 AM – 2:40 PM day. Homeroom, Anchor
 * Time and the morning periods are shared; the midday block and everything after
 * it shifts with the student's lunch. Every shift adds up to the same 400
 * minutes: homeroom (11) + seven 42-minute periods + Anchor Time (25) + lunch
 * (30) + eight five-minute passing periods.
 */
const LUNCH_BELLS: Record<LunchId, readonly Slot[]> = {
  lunch1: [
    ['HR', '08:00', '08:11'],
    ['P1', '08:16', '08:58'],
    ['ANCHOR', '09:03', '09:28'],
    ['P2', '09:33', '10:15'],
    ['P3', '10:20', '11:02'],
    ['P4', '11:07', '11:49'],
    ['LUNCH', '11:49', '12:19'],
    ['P5', '12:24', '13:06'],
    ['P6', '13:11', '13:53'],
    ['P7', '13:58', '14:40'],
  ],
  lunch2: [
    ['HR', '08:00', '08:11'],
    ['P1', '08:16', '08:58'],
    ['ANCHOR', '09:03', '09:28'],
    ['P2', '09:33', '10:15'],
    ['P3', '10:20', '11:02'],
    ['LUNCH', '11:02', '11:32'],
    ['P4', '11:37', '12:19'],
    ['P5', '12:24', '13:06'],
    ['P6', '13:11', '13:53'],
    ['P7', '13:58', '14:40'],
  ],
  lunch3: [
    ['HR', '08:00', '08:11'],
    ['P1', '08:16', '08:58'],
    ['ANCHOR', '09:03', '09:28'],
    ['P2', '09:33', '10:15'],
    ['P3', '10:20', '11:02'],
    ['P4', '11:07', '11:49'],
    ['P5', '11:54', '12:36'],
    ['LUNCH', '12:36', '13:06'],
    ['P6', '13:11', '13:53'],
    ['P7', '13:58', '14:40'],
  ],
}

/** A/B week detection follows the provided 2026–27 High School calendar. */
export function isADay(week: Week, day: WeekdayIndex): boolean {
  return week === 'A' ? day % 2 === 0 : day % 2 === 1
}

export const dayTypeFor = (week: Week, day: WeekdayIndex): Week => (isADay(week, day) ? 'A' : 'B')
export const autoWeek = weekForDate

/** "11:23 AM – 11:53 AM" for a lunch shift. */
export function lunchWindow(lunch: LunchId): string {
  const slot = LUNCH_BELLS[lunch].find((entry) => entry[0] === 'LUNCH')
  if (!slot) return ''
  return `${format(slot[1])} – ${format(slot[2])}`
}

function format(time: string): string {
  const minutes = toMinutes(time)
  const hour24 = Math.floor(minutes / 60)
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${String(minutes % 60).padStart(2, '0')} ${suffix}`
}

/** The full ordered timeline for one student on one day. */
export function buildDay(week: Week, day: WeekdayIndex, lunch: LunchId): ScheduleBlock[] {
  const courses = DAY_COURSES[dayTypeFor(week, day)]
  const isWednesday = day === 2

  return LUNCH_BELLS[lunch].map(([key, start, end]) => {
    const startMinute = toMinutes(start)
    const endMinute = toMinutes(end)

    if (key === 'LUNCH') {
      const option = LUNCHES.find((entry) => entry.id === lunch)
      return {
        id: `${day}-lunch`,
        kind: 'lunch' as const,
        label: 'Lunch',
        title: option?.name ?? 'Lunch',
        teacher: option?.detail,
        start: startMinute,
        end: endMinute,
      }
    }

    if (key === 'ANCHOR') {
      return {
        id: `${day}-anchor`,
        kind: 'anchor' as const,
        label: 'Anchor Time',
        title: 'Anchor Time',
        start: startMinute,
        end: endMinute,
      }
    }

    if (key === 'HR') {
      return {
        id: `${day}-hr`,
        kind: 'homeroom' as const,
        label: 'Homeroom',
        title: HOMEROOM[0],
        teacher: HOMEROOM[1],
        room: HOMEROOM[2],
        start: startMinute,
        end: endMinute,
      }
    }

    const period = Number(key.slice(1))
    // Wednesday swaps the last period for a school-wide study hall.
    const [title, teacher, room] =
      isWednesday && period === 7 ? WEDNESDAY_ADVISORY : courses[period - 1]

    return {
      id: `${day}-p${period}`,
      kind: isWednesday && period === 7 ? ('advisory' as const) : ('class' as const),
      label: `Period ${period}`,
      title,
      teacher,
      room,
      start: startMinute,
      end: endMinute,
    }
  })
}
