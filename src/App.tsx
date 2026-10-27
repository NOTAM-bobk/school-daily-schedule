import BackgroundNoise from "./components/ui/background-noise"
import { useEffect, useMemo, useState } from 'react'
import { CountdownCard, type StatusTone } from './components/CountdownCard'
import { DayStrip } from './components/DayStrip'
import { LunchPicker } from './components/LunchPicker'
import { Timeline } from './components/Timeline'
import { WeekSwitcher, type WeekChoice } from './components/WeekSwitcher'
import { LUNCHES, SCHOOL, autoWeek, buildDay, dayTypeFor } from './data/schedule'
import { dateKey, isSchoolDay, noSchoolReason, nextSchoolDate, EARLY_RELEASES } from './data/calendar'
import { useNow, useStoredState } from './lib/hooks'
import { getDayStatus, type DayStatus } from './lib/status'
import {
  WEEKDAY_NAMES,
  dayKey,
  formatClock,
  formatLongDate,
  formatShortDate,
  nextSchoolWeekdayIndex,
  secondsSinceMidnight,
  secondsUntilWeekdayStart,
  weekdayIndex,
} from './lib/time'
import type { LunchId, ScheduleBlock, Week, WeekdayIndex } from './types'

const WEEK_KEY = 'minnetonka.week'
const LUNCH_KEY = 'minnetonka.lunch'
const VISITS_KEY = 'minnetonka.visits'

const FOOTER_LINKS = [
  'AB week schedule',
  'Daily calendar',
  'Year calendar',
  'Lunch',
  'Settings',
  'TV Panel',
  'Admin',
] as const

interface Hero {
  eyebrow: string
  caption: string
  timer: number | null
  progress: number | null
  statusLabel: string
  tone: StatusTone
  meta: string[]
}

export default function App() {
  const now = useNow(1000)
  const todayKey = dayKey(now)
  const todayIndex = weekdayIndex(now)
  const schoolToday = todayIndex <= 4 && isSchoolDay(now)
  const closureReason = noSchoolReason(now)
  const nextSchoolDay = nextSchoolDate(now)
  const calendarNotice = EARLY_RELEASES[dateKey(now)]

  const [storedWeek, setStoredWeek] = useStoredState<WeekChoice>(WEEK_KEY, 'auto')
  const [storedLunch, setStoredLunch] = useStoredState<LunchId>(LUNCH_KEY, 'lunch2')

  // Total visits tracked in localStorage
  const [totalVisits, setTotalVisits] = useState<number>(1)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VISITS_KEY)
      const current = stored ? parseInt(stored, 10) : 0
      const next = isNaN(current) ? 1 : current + 1
      window.localStorage.setItem(VISITS_KEY, String(next))
      setTotalVisits(next)
    } catch {
      // localStorage may fail in restricted/private modes
    }
  }, [])

  // Validate whatever came out of localStorage before trusting it.
  const weekChoice: WeekChoice = storedWeek === 'A' || storedWeek === 'B' ? storedWeek : 'auto'
  const lunch: LunchId = LUNCHES.some((entry) => entry.id === storedLunch) ? storedLunch : 'lunch2'

  const [selectedDay, setSelectedDay] = useState<WeekdayIndex>(() =>
    schoolToday ? (todayIndex as WeekdayIndex) : 0,
  )

  // If the tab is left open past midnight, follow the new day.
  useEffect(() => {
    const index = weekdayIndex(new Date())
    if (index <= 4) setSelectedDay(index as WeekdayIndex)
  }, [todayKey])

  const detectedWeek = useMemo(() => autoWeek(new Date()), [todayKey])
  const week: Week = weekChoice === 'auto' ? detectedWeek : weekChoice

  const blocks = useMemo(() => buildDay(week, selectedDay, lunch), [week, selectedDay, lunch])
  const dayType = dayTypeFor(week, selectedDay)
  const live = schoolToday && selectedDay === todayIndex
  const nowSeconds = secondsSinceMidnight(now)
  const status = getDayStatus(blocks, nowSeconds)

  const hero = describeHero({
    now,
    live,
    schoolToday,
    selectedDay,
    todayIndex,
    status,
    blocks,
    dayType,
    closureReason,
    nextSchoolDay,
  })

  const timerTarget = useMemo(() => {
    if (hero.timer === null) return null
    const target = new Date(now)
    target.setMilliseconds(0)
    target.setSeconds(target.getSeconds() + hero.timer)
    return target
  }, [now, hero.timer])

  return (
    <div className="page">
      <BackgroundNoise />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <p className="brand-name">{SCHOOL.name}</p>
            <p className="brand-sub">Daily bell schedule · {SCHOOL.year}</p>
          </div>
        </div>

        <div className="header-tools">
          <span className="week-badge">Week {week}</span>
          <div className="clock">
            <span className="clock-date">{formatShortDate(now)}</span>
            <time className="clock-time">{formatClock(nowSeconds / 60, true)}</time>
          </div>
        </div>
      </header>

      <main className="layout">
        {/* Main 2-column view: Timer on Left, Day Schedule on Right */}
        <div className="split-view">
          <div className="split-left">
            <CountdownCard
              eyebrow={hero.eyebrow}
              caption={hero.caption}
              timer={hero.timer}
              targetDate={timerTarget}
              progress={hero.progress}
              statusLabel={hero.statusLabel}
              tone={hero.tone}
              meta={hero.meta}
            />
          </div>

          <div className="split-right">
            {!schoolToday && <p className="card-sub calendar-notice">{closureReason === 'Weekend' ? 'Weekend · no classes today' : `${closureReason ?? 'No classes today'} · no classes today`}{nextSchoolDay ? ` Next school day: ${formatLongDate(nextSchoolDay)}` : ''}</p>}
            {calendarNotice && schoolToday && <p className="card-sub calendar-notice">{calendarNotice}</p>}
            {schoolToday && <p className="card-sub calendar-notice">Bell times and Anchor Time are not verified for 2026–27. The attached daily timetable is from 2024–25, so use the countdown as a placeholder until current times are provided.</p>}
            <Timeline
              blocks={blocks}
              lunch={lunch}
              day={selectedDay}
              dayType={dayType}
              live={live}
              nowSeconds={nowSeconds}
            />
          </div>
        </div>

        <section className="schedule-controls" aria-label="Schedule controls">
          <div className="controls-date">
            <span className="controls-weekday">{WEEKDAY_NAMES[selectedDay]}</span>
            <span className="controls-full-date">{formatLongDate(now)}</span>
          </div>

          <div className="compact-controls">
            <DayStrip selected={selectedDay} todayIndex={todayIndex} onSelect={setSelectedDay} />
            <WeekSwitcher value={weekChoice} detected={detectedWeek} onChange={setStoredWeek} />
          </div>
          <LunchPicker value={lunch} onChange={setStoredLunch} />
        </section>

      </main>

      {/* Footer with requested links and total visits counter */}
      <footer className="footer">
        <nav className="footer-links" aria-label="Schedule quick links">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="footer-link"
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="footer-visits">
          <span className="visits-badge">
            <span className="visits-dot" aria-hidden />
            Your total visits: <strong className="visits-number">{totalVisits}</strong>
          </span>
        </div>

        <div className="footer-notes">
          <p>
            Bell times follow your device clock ({formatLongDate(now)}). Schedule data lives in{' '}
            <code>src/data/schedule.ts</code>.
          </p>
          <p>
            A/B rotation: A weeks put A days on Mon · Wed · Fri. Lunch shift, day and week choices are saved in this
            browser.
          </p>
        </div>
      </footer>
    </div>
  )
}

interface HeroArgs {
  now: Date
  live: boolean
  schoolToday: boolean
  selectedDay: WeekdayIndex
  todayIndex: number
  status: DayStatus
  blocks: ScheduleBlock[]
  dayType: Week
  closureReason: string | null
  nextSchoolDay: Date | null
}

function describeHero(args: HeroArgs): Hero {
  const { now, live, schoolToday, selectedDay, todayIndex, status, blocks, dayType, closureReason, nextSchoolDay } = args
  const firstBell = blocks[0]?.start ?? 0
  const dayName = WEEKDAY_NAMES[selectedDay]
  const classCount = blocks.filter((block) => block.kind === 'class').length
  const daySummary = [`${blocks.length} bells`, `${classCount} classes`]

  if (live) {
    if (status.phase === 'in' && status.current) {
      const current = status.current
      const isLunch = current.kind === 'lunch'
      return {
        eyebrow: current.label,
        caption: `${current.label} ends at ${formatClock(current.end)}`,
        timer: status.seconds,
        progress: status.progress,
        statusLabel: isLunch ? 'Lunch' : 'In session',
        tone: isLunch ? 'lunch' : 'live',
        meta: [`${current.end - current.start} min`],
      }
    }

    if (status.phase === 'passing' && status.next) {
      const next = status.next
      return {
        eyebrow: 'Passing period',
        caption: `${next.label} starts at ${formatClock(next.start)}`,
        timer: status.seconds,
        progress: null,
        statusLabel: 'Between bells',
        tone: 'live',
        meta: [],
      }
    }

    if (status.phase === 'before' && status.next) {
      return {
        eyebrow: `${dayName} · ${dayType} day`,
        caption: `First bell rings at ${formatClock(firstBell)}`,
        timer: status.seconds,
        progress: null,
        statusLabel: 'Before school',
        tone: 'idle',
        meta: daySummary,
      }
    }

    const nextDay = nextSchoolWeekdayIndex(todayIndex)
    return {
      eyebrow: 'School day complete',
      caption: `Back ${WEEKDAY_NAMES[nextDay]} for the first bell at ${formatClock(firstBell)}`,
      timer: secondsUntilWeekdayStart(now, nextDay, firstBell),
      progress: null,
      statusLabel: "School's out",
      tone: 'off',
      meta: [`${blocks.length} bells done`],
    }
  }

  if (!schoolToday) {
    return {
      eyebrow: closureReason ?? 'No classes today',
      caption: `${nextSchoolDay ? `Next school day: ${formatLongDate(nextSchoolDay)}. ` : ''}Bell times are awaiting the current timetable.`,
      timer: null,
      progress: null,
      statusLabel: 'No school today',
      tone: 'off',
      meta: [],
    }
  }

  return {
    eyebrow: `${dayName} · ${dayType} day`,
    caption: `${dayName} starts at ${formatClock(firstBell)}`,
    timer: secondsUntilWeekdayStart(now, selectedDay, firstBell),
    progress: null,
    statusLabel: 'Preview',
    tone: 'idle',
    meta: daySummary,
  }
}
