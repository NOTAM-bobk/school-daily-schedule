/** Day-type of the A/B rotation. */
export type Week = 'A' | 'B'

/** 0 = Monday … 4 = Friday. Weekends are handled separately in the UI. */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4

export type LunchId = 'lunch1' | 'lunch2' | 'lunch3'

export type ClockFormat = '12h' | '24h'
export type DateFormat = 'long' | 'short' | 'numeric'
export type FontChoice = 'ndot' | 'geist' | 'system'
export type ColorTheme = 'ocean' | 'violet' | 'light'
export type DisplayMode = 'normal' | 'tv'
export type DetailsChoice = 'on' | 'off'
export type GlowColor = 'teal' | 'blue' | 'violet' | 'amber' | 'rose'

export interface DisplaySettings {
  clockFormat: ClockFormat
  dateFormat: DateFormat
  font: FontChoice
  colorTheme: ColorTheme
  displayMode: DisplayMode
  showCourseDetails: DetailsChoice
  glowColor: GlowColor
}

export type BlockKind = 'homeroom' | 'class' | 'lunch' | 'advisory' | 'anchor'

export interface ScheduleBlock {
  id: string
  kind: BlockKind
  /** Bell label, e.g. "Period 3" or "Anchor Time". */
  label: string
  /** What the student is actually doing, e.g. "Chemistry". */
  title: string
  teacher?: string
  room?: string
  /** Minutes from midnight in the viewer's local time. */
  start: number
  end: number
}

export interface LunchOption {
  id: LunchId
  name: string
  detail: string
}
