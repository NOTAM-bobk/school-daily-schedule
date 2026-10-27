import type { Week } from '../types'

/** Official 2026–27 High School A/B calendar. Missing labels on very short/holiday weeks are inferred from the surrounding rotation. */
const WEEK_BY_MONDAY: Record<string, Week> = {
  '2026-08-31': 'A', '2026-09-07': 'B', '2026-09-14': 'A', '2026-09-21': 'B', '2026-09-28': 'A',
  '2026-10-05': 'B', '2026-10-12': 'A', '2026-10-19': 'A', '2026-10-26': 'B',
  '2026-11-02': 'A', '2026-11-09': 'B', '2026-11-16': 'A', '2026-11-23': 'B', '2026-11-30': 'B',
  '2026-12-07': 'A', '2026-12-14': 'B', '2026-12-21': 'A', '2026-12-28': 'B',
  '2027-01-04': 'A', '2027-01-11': 'B', '2027-01-18': 'A', '2027-01-25': 'B',
  '2027-02-01': 'B', '2027-02-08': 'A', '2027-02-15': 'B', '2027-02-22': 'A',
  '2027-03-01': 'B', '2027-03-08': 'A', '2027-03-15': 'B', '2027-03-22': 'A', '2027-03-29': 'B',
  '2027-04-05': 'B', '2027-04-12': 'A', '2027-04-19': 'B', '2027-04-26': 'A',
  '2027-05-03': 'B', '2027-05-10': 'A', '2027-05-17': 'B', '2027-05-24': 'A', '2027-05-31': 'B',
  '2027-06-07': 'B',
}

/** Student no-school dates shown on the district calendar (weekends are handled separately). */
const NO_SCHOOL: Record<string, string> = {
  '2026-09-07': 'Labor Day',
  '2026-09-21': 'Yom Kippur',
  '2026-10-09': 'Parent-teacher conferences',
  '2026-10-15': 'Teacher statewide meetings',
  '2026-10-16': 'Teacher statewide meetings',
  '2026-11-06': 'Planning and grading day',
  '2026-11-25': 'Thanksgiving break',
  '2026-11-26': 'Thanksgiving break',
  '2026-11-27': 'Thanksgiving break',
  '2026-12-23': 'Winter break',
  '2026-12-24': 'Winter break',
  '2026-12-25': 'Winter break',
  '2026-12-28': 'Winter break',
  '2026-12-29': 'Winter break',
  '2026-12-30': 'Winter break',
  '2026-12-31': 'Winter break',
  '2027-01-01': 'Winter break',
  '2027-01-04': 'Professional learning day',
  '2027-01-18': 'Martin Luther King Jr. Day',
  '2027-01-25': 'Planning and grading day',
  '2027-02-15': 'Presidents Day',
  '2027-03-05': 'Parent-teacher conferences',
  '2027-03-10': 'Eid',
  '2027-03-26': 'No school',
  '2027-03-29': 'Spring break',
  '2027-03-30': 'Spring break',
  '2027-03-31': 'Spring break',
  '2027-04-01': 'Spring break',
  '2027-04-02': 'Spring break',
  '2027-04-05': 'Planning and grading day',
  '2027-05-31': 'Memorial Day',
}

export const EARLY_RELEASES: Record<string, string> = {
  '2026-09-25': 'Two-hour early release · Homecoming',
  '2027-06-08': 'Tentative two-hour early release · last day of school',
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function weekForDate(date: Date): Week {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const key = dateKey(monday)
  const known = WEEK_BY_MONDAY[key]
  if (known) return known
  const anchor = new Date(2026, 7, 31)
  const distance = Math.floor((monday.getTime() - anchor.getTime()) / (7 * 86_400_000))
  return ((distance % 2) + 2) % 2 === 0 ? 'A' : 'B'
}

export function noSchoolReason(date: Date): string | null {
  const day = date.getDay()
  if (day === 0 || day === 6) return 'Weekend'
  const key = dateKey(date)
  if (key < '2026-09-01' || key > '2027-06-08') return 'Outside the 2026–27 student calendar'
  return NO_SCHOOL[key] ?? null
}

export function isSchoolDay(date: Date): boolean {
  return noSchoolReason(date) === null
}

export function nextSchoolDate(from: Date): Date | null {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  for (let days = 0; days < 370; days += 1) {
    date.setDate(date.getDate() + 1)
    if (isSchoolDay(date)) return date
  }
  return null
}
