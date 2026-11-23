import type { Goal, Milestone, Step } from './types';

export type Progress = { done: number; total: number; ratio: number };

function fromSteps(steps: Step[]): Progress {
  const total = steps.length;
  const done = steps.filter((s) => s.doneAt !== null).length;
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export function milestoneProgress(milestone: Milestone): Progress {
  return fromSteps(milestone.steps);
}

export function goalProgress(goal: Goal): Progress {
  return fromSteps(goal.milestones.flatMap((m) => m.steps));
}

/** The first step not yet done, in milestone order. */
export function nextStep(goal: Goal): { milestone: Milestone; step: Step } | null {
  for (const milestone of goal.milestones) {
    const step = milestone.steps.find((s) => s.doneAt === null);
    if (step) return { milestone, step };
  }
  return null;
}

export function formatTargetDate(date: string | null): string {
  if (!date) return 'No target date';
  const [y, m, d] = date.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export type Overall = {
  /** Average of each goal's progress, so every goal counts equally. */
  ratio: number;
  goals: number;
  completedGoals: number;
  stepsDone: number;
  stepsTotal: number;
};

export function overallProgress(goals: Goal[]): Overall {
  const withSteps = goals.map(goalProgress).filter((p) => p.total > 0);
  const ratio = withSteps.length === 0 ? 0 : withSteps.reduce((sum, p) => sum + p.ratio, 0) / withSteps.length;
  return {
    ratio,
    goals: goals.length,
    completedGoals: withSteps.filter((p) => p.done === p.total).length,
    stepsDone: withSteps.reduce((n, p) => n + p.done, 0),
    stepsTotal: withSteps.reduce((n, p) => n + p.total, 0),
  };
}

export function formatMinutes(minutes: number | undefined): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `about ${minutes} min`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  return `about ${hours} hr`;
}
