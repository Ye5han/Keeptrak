export type Step = {
  id: string;
  title: string;
  doneAt: string | null;
  source: 'ai' | 'manual';
};

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
  status: GoalStatus;
  createdAt: string;
  milestones: Milestone[];
};
