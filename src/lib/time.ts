import type { WeekdayIndex } from '../types'

export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const
export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/

/** "07:45" → 465 (minutes from midnight). */
export function toMinutes(value: string): number {
  const match = TIME_PATTERN.exec(value)
  if (!match) throw new Error(`Invalid time literal: ${value}`)
  return Number(match[1]) * 60 + Number(match[2])
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function secondsSinceMidnight(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
}

/** Minutes from midnight → "8:00 AM" (optionally with seconds). */
export function formatClock(totalMinutes: number, withSeconds = false): string {
  const abs = Math.abs(totalMinutes)
  const hour24 = Math.floor(abs / 60) % 24
  const minutes = Math.floor(abs % 60)
  const seconds = Math.floor((abs * 60) % 60)
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const ss = withSeconds ? `:${String(seconds).padStart(2, '0')}` : ''
  return `${hour12}:${String(minutes).padStart(2, '0')}${ss} ${suffix}`
}

/** Seconds → "04:32" or "1:04:32". */
export function formatCountdown(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

const longDate = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

const shortDate = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

export const formatLongDate = (date: Date): string => longDate.format(date)
export const formatShortDate = (date: Date): string => shortDate.format(date)

/** Stable per-day cache key, e.g. "2026-10-27" in local time. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Monday 00:00 of the week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - weekdayIndex(date))
  return monday
}

export function wholeDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** The next weekday (0–4) after `dayIndex`, skipping the weekend. */
export function nextSchoolWeekdayIndex(dayIndex: number): WeekdayIndex {
  for (let step = 1; step <= 7; step += 1) {
    const candidate = (dayIndex + step) % 7
    if (candidate <= 4) return candidate as WeekdayIndex
  }
  return 0
}

/**
 * Seconds until the next occurrence of `targetDay`'s first bell, always positive.
 * Today counts only while its first bell is still ahead. DST shifts are ignored,
 * which is accurate to the minute for a single week.
 */
export function secondsUntilWeekdayStart(now: Date, targetDay: WeekdayIndex, startMinute: number): number {
  const nowSeconds = secondsSinceMidnight(now)
  const targetSeconds = startMinute * 60
  let daysAhead = (targetDay - weekdayIndex(now) + 7) % 7
  if (daysAhead === 0 && nowSeconds >= targetSeconds) daysAhead = 7
  return daysAhead * 86_400 + targetSeconds - nowSeconds
}
