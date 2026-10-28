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

/** Periods 1–7 for each kind of day. */
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

type SlotKey = 'ANCHOR' | 'LUNCH' | `P${1 | 2 | 3 | 4 | 5 | 6 | 7}`
type Slot = readonly [key: SlotKey, start: string, end: string]

/** Existing bell times, with the advisory/homeroom row omitted from the display. */
const LUNCH_BELLS: Record<LunchId, readonly Slot[]> = {
  lunch1: [
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

export function isADay(week: Week, day: WeekdayIndex): boolean {
  return week === 'A' ? day % 2 === 0 : day % 2 === 1
}

export const dayTypeFor = (week: Week, day: WeekdayIndex): Week => (isADay(week, day) ? 'A' : 'B')
export const autoWeek = weekForDate

export function lunchWindow(lunch: LunchId, use24Hour = false): string {
  const slot = LUNCH_BELLS[lunch].find((entry) => entry[0] === 'LUNCH')
  if (!slot) return ''
  return `${format(slot[1], use24Hour)} – ${format(slot[2], use24Hour)}`
}

function format(time: string, use24Hour = false): string {
  const minutes = toMinutes(time)
  const hour24 = Math.floor(minutes / 60)
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const hour = use24Hour ? String(hour24).padStart(2, '0') : String(hour12)
  return `${hour}:${String(minutes % 60).padStart(2, '0')}${use24Hour ? '' : ` ${suffix}`}`
}

export function buildDay(week: Week, day: WeekdayIndex, lunch: LunchId): ScheduleBlock[] {
  const courses = DAY_COURSES[dayTypeFor(week, day)]

  const periods = LUNCH_BELLS[lunch].map(([key, start, end]) => {
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

    const period = Number(key.slice(1))
    const [title, teacher, room] = courses[period - 1]
    return {
      id: `${day}-p${period}`,
      kind: 'class' as const,
      label: `Period ${period}`,
      title,
      teacher,
      room,
      start: startMinute,
      end: endMinute,
    }
  })

  return periods
}
