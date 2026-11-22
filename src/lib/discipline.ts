import type { Goal } from './types';

/**
 * Discipline score: of the days each goal was active in the last 7 days, on how many did you
 * tick off at least one of its steps?
 *
 * - A goal counts from the day it was created until the day its last step was done.
 * - Today only counts once you have ticked something for that goal, so the score never drops
 *   during the day just because the day isn't over yet.
 * - "Did a little" on a busy day counts as moving the goal forward.
 * - A rest day is left out of the score, at most one per goal in the 7 days.
 */

export const REST_DAYS_PER_WEEK = 1;

export const WINDOW_DAYS = 7;

export type Band = 'red' | 'yellow' | 'green';

export function bandOf(ratio: number): Band {
  if (ratio >= 0.8) return 'green';
  if (ratio >= 0.3) return 'yellow';
  return 'red';
}

/** Local calendar date as YYYY-MM-DD. */
export function localDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function lastDays(now: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (count - 1 - i));
    return localDay(d);
  });
}

export type DayResult = { day: string; hit: number; active: number };

/** Whether this goal can still take a rest day in the current 7-day window. */
export function canRest(goal: Goal, now: Date = new Date()): boolean {
  const days = lastDays(now, WINDOW_DAYS);
  const today = days[days.length - 1];
  const used = (goal.restDays ?? []).filter((d) => days.includes(d) && d !== today).length;
  return used < REST_DAYS_PER_WEEK;
}

export type Discipline = {
  /** null when there is nothing to score yet. */
  ratio: number | null;
  band: Band | null;
  days: DayResult[];
  today: { hit: number; active: number };
};

export function disciplineScore(goals: Goal[], now: Date = new Date()): Discipline {
  const days = lastDays(now, WINDOW_DAYS);
  const today = days[days.length - 1];

  const perGoal = goals
    .map((goal) => {
      const steps = goal.milestones.flatMap((m) => m.steps);
      const doneDays = new Set([
        ...steps.filter((s) => s.doneAt).map((s) => localDay(new Date(s.doneAt as string))),
        ...(goal.effortDays ?? []),
      ]);
      // Only the most recent allowed rest days in the window are honoured.
      const restDays = new Set(
        (goal.restDays ?? []).filter((d) => days.includes(d)).sort().slice(-REST_DAYS_PER_WEEK)
      );
      const allDone = steps.length > 0 && steps.every((s) => s.doneAt);
      const finishedOn = allDone
        ? localDay(new Date(Math.max(...steps.map((s) => Date.parse(s.doneAt as string)))))
        : null;
      return { start: localDay(new Date(goal.createdAt)), finishedOn, doneDays, restDays, hasSteps: steps.length > 0 };
    })
    .filter((g) => g.hasSteps);

  const results: DayResult[] = days.map((day) => {
    let hit = 0;
    let active = 0;
    for (const g of perGoal) {
      if (day < g.start) continue;
      if (g.finishedOn && day > g.finishedOn) continue;
      const didSomething = g.doneDays.has(day);
      if (day === today && !didSomething) continue; // today isn't over yet
      if (g.restDays.has(day) && !didSomething) continue; // a rest day doesn't count against you
      active += 1;
      if (didSomething) hit += 1;
    }
    return { day, hit, active };
  });

  const hit = results.reduce((n, r) => n + r.hit, 0);
  const active = results.reduce((n, r) => n + r.active, 0);
  const ratio = active === 0 ? null : hit / active;

  // Today's progress counts every goal that is still open today, ticked or not.
  const openToday = perGoal.filter(
    (g) => today >= g.start && !(g.finishedOn && today > g.finishedOn) && !(g.restDays.has(today) && !g.doneDays.has(today))
  );
  const hitToday = openToday.filter((g) => g.doneDays.has(today)).length;

  return { ratio, band: ratio === null ? null : bandOf(ratio), days: results, today: { hit: hitToday, active: openToday.length } };
}
