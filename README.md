# School Daily Schedule

A single-page daily schedule for students: a **live countdown** to the next bell, a **three-lunch shift selector**, an **A/B week switcher**, today's date and the full bell-by-bell timeline. Styled like a Vercel dashboard — near-black canvas, hairline borders, Geist / Geist Mono.

Built with React + TypeScript + Vite. Static output, zero server, deploys to Vercel as-is.

## Features

| Feature | Where |
| --- | --- |
| Live countdown (to the end of the current block, or the next bell) | `src/components/CountdownCard.tsx` |
| Progress bar through the current period + per-row progress in the timeline | `src/components/CountdownCard.tsx`, `src/components/Timeline.tsx` |
| Three lunch shifts (early / middle / late) — re-times the whole midday block | `src/components/LunchPicker.tsx` |
| A/B week switcher, with the week auto-detected and manually overridable | `src/components/WeekSwitcher.tsx` |
| Current date, live clock and Mon–Fri day strip | `src/App.tsx`, `src/components/DayStrip.tsx` |
| Timeline with Now / Next / past states and lunch highlighting | `src/components/Timeline.tsx` |

Choices are remembered in `localStorage`, so a student sets their lunch once.

## Schedule model

Everything is data in **`src/data/schedule.ts`** — that is the only file a school needs to edit.

- **7 periods plus homeroom**, in `DAY_COURSES`, keyed by day type (`A` days and `B` days take different courses).
- **A/B week rotation** — an A week puts A days on Mon · Wed · Fri; a B week flips it. The auto-detected week alternates weekly from `A_WEEK_ANCHOR`.
- **Three lunch bells** in `LUNCH_BELLS`. Homeroom and the morning periods are shared; picking Lunch 1, 2 or 3 shifts that student's midday block and afternoon bells.
- **Wednesday** swaps the last period for a school-wide study hall (see `isWednesday` in `buildDay`).

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build into dist/
npm run preview    # serve the built output
```

## Deploy to Vercel

`vercel.json` pins the framework, build command and output directory, so no dashboard configuration is needed.

**Dashboard:** import the repository at <https://vercel.com/new>, accept the detected settings and deploy.

**CLI:**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

## Project structure

```
index.html                 Vite entry, Geist font links, inline favicon
vercel.json                Vercel build settings
src/
  App.tsx                  state, hero countdown logic, layout
  main.tsx                 React root
  styles.css               design tokens + all styling
  data/schedule.ts         ← the school's schedule (courses, bells, lunches, A/B anchor)
  lib/time.ts              clock, date and countdown helpers
  lib/status.ts            "in session / passing / before / after" resolution
  lib/hooks.ts             useNow (1s tick) and useStoredState (localStorage)
  components/              CountdownCard, DayStrip, LunchPicker, WeekSwitcher, Timeline
  types.ts                 shared types
```

## Customizing

- **School name / year:** `SCHOOL` in `src/data/schedule.ts`.
- **Bell times:** the `LUNCH_BELLS` tables (`07:45` style 24-hour literals).
- **Courses:** `DAY_COURSES` — tuples of `[title, teacher, room]`, periods 1–7 in order.
- **Lunch labels:** `LUNCHES`.
- **Week rotation phase:** move `A_WEEK_ANCHOR` to any Monday that should be an A week.
- **Accent colour and theme:** the CSS variables at the top of `src/styles.css`.

Weekends show a "No school today" state and count down to the next school day; after the last bell the countdown rolls over to the next school morning.
