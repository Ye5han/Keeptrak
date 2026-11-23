# Keeptrak

A project and goal tracking app: set a goal, break it into milestones and steps, and watch a progress gauge fill as you tick steps off. AI step plans are coming next.

The first goal in the app is building Keeptrak itself.

## What works today (week 1)

- Home opens on **Today**: one next step per goal, ticked in one tap, plus "Did a little" for busy days and one rest day per goal per week
- After each tick, a quick Easy / OK / Hard and an optional note
- A compact summary with an overall gauge and a discipline score (last 7 days, red / yellow / green)
- Create a goal (title, why it matters, target date, where you are now)
- Goal screen with a big gauge, milestones with their own progress bars, and steps you tick off
- Add milestones and steps by hand
- Everything is saved on the phone (sign-in and cloud saving come in weeks 2 to 3)

## Run it on your Android phone

1. Install [Node.js](https://nodejs.org) (the LTS version) on your computer.
2. Install the **Expo Go** app from the Google Play Store on your phone.
3. On your computer, open a terminal in this folder and run:

   ```bash
   npm install
   npx expo start
   ```

4. Make sure your phone and computer are on the same Wi-Fi, open Expo Go, and scan the QR code shown in the terminal.

If the phone can't connect, run `npx expo start --tunnel` instead.

## Project layout

- `src/app/` screens (Expo Router: each file is a screen)
- `src/components/` the gauge and progress bar
- `src/lib/` data types, progress maths, the goals store, and the starting data

## Checks

```bash
npx tsc --noEmit   # typecheck
```

## The Keeptrak build goal (owner only)

New installs start with no goals. To add the "Launch the Keeptrak beta" goal, which tracks building this app, long-press the Keeptrak logo at the top of the home screen for about a second.
