import { useEffect, useMemo, useState } from 'react'
import { CountdownCard, type StatusTone } from './components/CountdownCard'
import { DayStrip } from './components/DayStrip'
import { LunchPicker } from './components/LunchPicker'
import { Timeline } from './components/Timeline'
import { WeekSwitcher, type WeekChoice } from './components/WeekSwitcher'
import { LUNCHES, SCHOOL, autoWeek, buildDay, dayTypeFor } from './data/schedule'
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

const WEEK_KEY = 'northside.week'
const LUNCH_KEY = 'northside.lunch'

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
  const schoolToday = todayIndex <= 4

  const [storedWeek, setStoredWeek] = useStoredState<WeekChoice>(WEEK_KEY, 'auto')
  const [storedLunch, setStoredLunch] = useStoredState<LunchId>(LUNCH_KEY, 'lunch2')

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
  })

  return (
    <div className="page">
      <div className="glow" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <p className="brand-name">{SCHOOL.name}</p>
            <p className="brand-sub">Daily bell schedule · {SCHOOL.year}</p>
          </div>
        </div>

        <div className="clock">
          <span className="clock-date">{formatShortDate(now)}</span>
          <time className="clock-time">{formatClock(nowSeconds / 60, true)}</time>
        </div>
      </header>

      <main className="layout">
        <CountdownCard
          eyebrow={hero.eyebrow}
          caption={hero.caption}
          timer={hero.timer}
          progress={hero.progress}
          statusLabel={hero.statusLabel}
          tone={hero.tone}
          meta={hero.meta}
        />

        <section className="card controls" aria-label="Schedule controls">
          <div className="controls-date">
            <p className="controls-weekday">{WEEKDAY_NAMES[selectedDay]}</p>
            <p className="controls-full-date">{formatLongDate(now)}</p>
          </div>

          <DayStrip selected={selectedDay} todayIndex={todayIndex} onSelect={setSelectedDay} />
          <WeekSwitcher value={weekChoice} detected={detectedWeek} onChange={setStoredWeek} />
          <LunchPicker value={lunch} onChange={setStoredLunch} />
        </section>

        <Timeline
          blocks={blocks}
          lunch={lunch}
          day={selectedDay}
          dayType={dayType}
          live={live}
          nowSeconds={nowSeconds}
        />
      </main>

      <footer className="footer">
        <p>
          Bell times follow your device clock ({formatLongDate(now)}). Schedule data lives in{' '}
          <code>src/data/schedule.ts</code>.
        </p>
        <p>
          A/B rotation: A weeks put A days on Mon · Wed · Fri. Lunch shift, day and week choices are saved in this
          browser.
        </p>
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
}

function describeHero(args: HeroArgs): Hero {
  const { now, live, schoolToday, selectedDay, todayIndex, status, blocks, dayType } = args
  const firstBell = blocks[0]?.start ?? 0
  const dayName = WEEKDAY_NAMES[selectedDay]
  const classCount = blocks.filter((block) => block.kind === 'class').length
  const daySummary = [`${blocks.length} bells`, `${classCount} classes`]

  if (live) {
    if (status.phase === 'in' && status.current) {
      const current = status.current
      const isLunch = current.kind === 'lunch'
      return {
        eyebrow: `${current.label} · ${current.title}`,
        caption: `${current.label} ends at ${formatClock(current.end)}`,
        timer: status.seconds,
        progress: status.progress,
        statusLabel: isLunch ? 'Lunch' : 'In session',
        tone: isLunch ? 'lunch' : 'live',
        meta: [current.teacher, current.room, `${current.end - current.start} min`].filter(Boolean) as string[],
      }
    }

    if (status.phase === 'passing' && status.next) {
      const next = status.next
      return {
        eyebrow: 'Passing period',
        caption: `${next.label} · ${next.title} starts at ${formatClock(next.start)}`,
        timer: status.seconds,
        progress: null,
        statusLabel: 'Between bells',
        tone: 'live',
        meta: [next.teacher, next.room].filter(Boolean) as string[],
      }
    }

    if (status.phase === 'before' && status.next) {
      return {
        eyebrow: `${dayName} · ${dayType} day`,
        caption: `The first bell rings at ${formatClock(firstBell)}`,
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

  return {
    eyebrow: `${dayName} · ${dayType} day`,
    caption: schoolToday
      ? `${dayName} starts at ${formatClock(firstBell)}`
      : `No classes today — ${dayName} starts at ${formatClock(firstBell)}`,
    timer: secondsUntilWeekdayStart(now, selectedDay, firstBell),
    progress: null,
    statusLabel: schoolToday ? 'Preview' : 'No school today',
    tone: 'idle',
    meta: daySummary,
  }
}
