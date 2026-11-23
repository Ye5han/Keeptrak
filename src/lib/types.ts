export type Step = {
  id: string;
  title: string;
  /** How you know the step is done. */
  doneCheck?: string;
  /** Rough time estimate in minutes. */
  minutes?: number;
  doneAt: string | null;
  source: 'ai' | 'manual';
  /** How it felt, picked right after ticking it. */
  feeling?: Feeling;
  note?: string;
};

export type Feeling = 'easy' | 'ok' | 'hard';

export type Milestone = {
  id: string;
  title: string;
  steps: Step[];
};

export type GoalStatus = 'active' | 'done' | 'paused';

export type Goal = {
  id: string;
  title: string;
  why: string;
  context: string;
  targetDate: string | null; // ISO date, YYYY-MM-DD
  /** How much time the user can give this most days, in minutes. */
  dailyMinutes?: number | null;
  status: GoalStatus;
  createdAt: string;
  milestones: Milestone[];
  /** Local days (YYYY-MM-DD) where the user did a little toward the goal without finishing a step. */
  effortDays?: string[];
  /** Local days (YYYY-MM-DD) the user took off this goal. They don't count against discipline. */
  restDays?: string[];
};
