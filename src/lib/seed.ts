import type { Goal, Milestone } from './types';

const step = (id: string, title: string, done = false, minutes?: number) => ({
  id,
  title,
  minutes,
  doneAt: done ? '2026-11-22T00:00:00.000Z' : null,
  source: 'manual' as const,
});

const milestones: Milestone[] = [
  {
    id: 'm-setup',
    title: 'Week 1: Setup',
    steps: [
      step('s-plan', 'Write the MVP plan', true),
      step('s-repo', 'Create the GitHub repository', true),
      step('s-shell', 'Build the app shell with a goals screen', true),
      step('s-phone', 'Run the app on an Android phone', false, 30),
      step('s-supabase', 'Create a Supabase project for sign-in and data', false, 20),
    ],
  },
  {
    id: 'm-tracking',
    title: 'Weeks 2-3: Tracking',
    steps: [
      step('s-signin', 'Add sign-in'),
      step('s-sync', 'Save goals and steps to the database'),
      step('s-edit', 'Edit, reorder and delete steps'),
    ],
  },
  {
    id: 'm-ai',
    title: 'Weeks 3-4: AI step plans',
    steps: [
      step('s-questions', 'Ask up to 3 clarifying questions'),
      step('s-generate', 'Generate milestones and steps with AI'),
      step('s-regenerate', 'Regenerate a single milestone'),
    ],
  },
  {
    id: 'm-prep',
    title: 'Week 5: Beta prep',
    steps: [
      step('s-feedback', 'Add plan ratings and the feedback button'),
      step('s-analytics', 'Add usage analytics'),
      step('s-reminder', 'Add the weekly reminder'),
    ],
  },
  {
    id: 'm-beta',
    title: 'Weeks 6-8: Beta test',
    steps: [
      step('s-testers', 'Invite 15 to 30 testers'),
      step('s-interviews', 'Hold 5 tester interviews'),
      step('s-decide', 'Decide: build version 2 or change course'),
    ],
  },
];

/**
 * The goal of building Keeptrak itself, with the MVP roadmap as its steps.
 * Testers start with no goals; the owner adds this one with a long-press on the home logo.
 */
export const starterGoals: Goal[] = [
  {
    id: 'g-keeptrak',
    title: 'Launch the Keeptrak beta',
    why: 'Find out if people actually like it and get real feedback.',
    context: 'Android first. MVP plan has six core features.',
    targetDate: '2027-01-17',
    status: 'active',
    createdAt: '2026-11-22T00:00:00.000Z',
    dailyMinutes: 60,
    milestones,
  },
];
