import type { ScheduleBlock } from '../types'

export type Phase = 'before' | 'in' | 'passing' | 'after'

export interface DayStatus {
  phase: Phase
  /** Block in session right now (only for phase "in"). */
  current?: ScheduleBlock
  /** The block the countdown is aimed at. */
  next?: ScheduleBlock
  /** Seconds until `next` — the end of the current block, or its start. */
  seconds: number | null
  /** 0–1 elapsed fraction of the current block. */
  progress: number
}

/** Where the day stands at `secondsSinceMidnight`, given the day's blocks. */
export function getDayStatus(blocks: ScheduleBlock[], secondsSinceMidnight: number): DayStatus {
  const current = blocks.find((block) => {
    const start = block.start * 60
    const end = block.end * 60
    return secondsSinceMidnight >= start && secondsSinceMidnight < end
  })

  if (current) {
    const start = current.start * 60
    const end = current.end * 60
    const next = blocks.find((block) => block.start > current.start)
    return {
      phase: 'in',
      current,
      next,
      seconds: end - secondsSinceMidnight,
      progress: (secondsSinceMidnight - start) / (end - start),
    }
  }

  const next = blocks.find((block) => block.start * 60 > secondsSinceMidnight)
  if (!next) {
    return { phase: 'after', seconds: null, progress: 0 }
  }

  const firstStart = blocks[0].start * 60
  return {
    phase: secondsSinceMidnight < firstStart ? 'before' : 'passing',
    next,
    seconds: next.start * 60 - secondsSinceMidnight,
    progress: 0,
  }
}
