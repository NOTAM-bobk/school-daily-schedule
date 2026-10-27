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
 */
import type { LunchId, LunchOption, ScheduleBlock, Week, WeekdayIndex } from '../types'
import { toMinutes } from '../lib/time'

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

type SlotKey = 'HR' | 'LUNCH' | `P${1 | 2 | 3 | 4 | 5 | 6 | 7}`
type Slot = readonly [key: SlotKey, start: string, end: string]

/**
 * Bell times per lunch shift. Homeroom and the morning periods are shared;
 * everything from the midday block onwards shifts with the student's lunch.
 */
const LUNCH_BELLS: Record<LunchId, readonly Slot[]> = {
  lunch1: [
    ['HR', '07:45', '07:57'],
    ['P1', '08:00', '08:47'],
    ['P2', '08:52', '09:39'],
    ['P3', '09:44', '10:31'],
    ['P4', '10:36', '11:23'],
    ['LUNCH', '11:23', '11:53'],
    ['P5', '11:58', '12:45'],
    ['P6', '12:50', '13:37'],
    ['P7', '13:42', '14:29'],
  ],
  lunch2: [
    ['HR', '07:45', '07:57'],
    ['P1', '08:00', '08:47'],
    ['P2', '08:52', '09:39'],
    ['P3', '09:44', '10:26'],
    ['LUNCH', '10:26', '10:56'],
    ['P4', '11:01', '11:48'],
    ['P5', '11:53', '12:40'],
    ['P6', '12:45', '13:32'],
    ['P7', '13:37', '14:24'],
  ],
  lunch3: [
    ['HR', '07:45', '07:57'],
    ['P1', '08:00', '08:47'],
    ['P2', '08:52', '09:39'],
    ['P3', '09:44', '10:26'],
    ['P4', '10:31', '11:18'],
    ['P5', '11:23', '12:10'],
    ['LUNCH', '12:10', '12:40'],
    ['P6', '12:45', '13:32'],
    ['P7', '13:37', '14:24'],
  ],
}

/** A week starts on a fixed Monday so the rotation can be derived from any date. */
const A_WEEK_ANCHOR = new Date(2026, 7, 17) // Monday, 17 Aug 2026 → A week

export function isADay(week: Week, day: WeekdayIndex): boolean {
  return week === 'A' ? day % 2 === 0 : day % 2 === 1
}

export const dayTypeFor = (week: Week, day: WeekdayIndex): Week => (isADay(week, day) ? 'A' : 'B')

/** Which kind of week a date falls in, alternating weekly from the anchor. */
export function autoWeek(date: Date): Week {
  const weeksSinceAnchor = Math.floor(
    (startOfMonday(date).getTime() - A_WEEK_ANCHOR.getTime()) / (7 * 86_400_000),
  )
  return ((weeksSinceAnchor % 2) + 2) % 2 === 0 ? 'A' : 'B'
}

function startOfMonday(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

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
