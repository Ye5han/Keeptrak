import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';

import type { DraftMilestone } from './ai';
import { newId } from './ids';
import { seedGoals } from './seed';
import { localDay } from './discipline';
import type { Feeling, Goal } from './types';

const STORAGE_KEY = 'keeptrak.goals.v1';

type State = { loaded: boolean; goals: Goal[] };

type Action =
  | { type: 'loaded'; goals: Goal[] }
  | { type: 'addGoal'; goal: Goal }
  | { type: 'deleteGoal'; goalId: string }
  | { type: 'toggleStep'; goalId: string; milestoneId: string; stepId: string; now: string }
  | { type: 'addStep'; goalId: string; milestoneId: string; title: string; id: string }
  | { type: 'addMilestone'; goalId: string; title: string; id: string }
  | { type: 'setPlan'; goalId: string; milestones: Goal['milestones'] }
  | { type: 'toggleDay'; goalId: string; field: 'effortDays' | 'restDays'; day: string }
  | { type: 'reflect'; goalId: string; stepId: string; feeling?: Feeling; note?: string };

function updateGoal(goals: Goal[], goalId: string, fn: (goal: Goal) => Goal): Goal[] {
  return goals.map((g) => (g.id === goalId ? fn(g) : g));
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loaded':
      return { loaded: true, goals: action.goals };
    case 'addGoal':
      return { ...state, goals: [action.goal, ...state.goals] };
    case 'deleteGoal':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.goalId) };
    case 'toggleStep':
      return {
        ...state,
        goals: updateGoal(state.goals, action.goalId, (goal) => ({
          ...goal,
          milestones: goal.milestones.map((m) =>
            m.id !== action.milestoneId
              ? m
              : {
                  ...m,
                  steps: m.steps.map((s) =>
                    s.id !== action.stepId ? s : { ...s, doneAt: s.doneAt ? null : action.now }
                  ),
                }
          ),
        })),
      };
    case 'addStep':
      return {
        ...state,
        goals: updateGoal(state.goals, action.goalId, (goal) => ({
          ...goal,
          milestones: goal.milestones.map((m) =>
            m.id !== action.milestoneId
              ? m
              : {
                  ...m,
                  steps: [
                    ...m.steps,
                    { id: action.id, title: action.title, doneAt: null, source: 'manual' },
                  ],
                }
          ),
        })),
      };
    case 'addMilestone':
      return {
        ...state,
        goals: updateGoal(state.goals, action.goalId, (goal) => ({
          ...goal,
          milestones: [...goal.milestones, { id: action.id, title: action.title, steps: [] }],
        })),
      };
    case 'setPlan':
      return {
        ...state,
        goals: updateGoal(state.goals, action.goalId, (goal) => ({ ...goal, milestones: action.milestones })),
      };
    case 'toggleDay':
      return {
        ...state,
        goals: updateGoal(state.goals, action.goalId, (goal) => {
          const days = goal[action.field] ?? [];
          return {
            ...goal,
            [action.field]: days.includes(action.day) ? days.filter((d) => d !== action.day) : [...days, action.day],
          };
        }),
      };
    case 'reflect':
      return {
        ...state,
        goals: updateGoal(state.goals, action.goalId, (goal) => ({
          ...goal,
          milestones: goal.milestones.map((m) => ({
            ...m,
            steps: m.steps.map((s) =>
              s.id !== action.stepId
                ? s
                : {
                    ...s,
                    ...(action.feeling !== undefined ? { feeling: action.feeling } : {}),
                    ...(action.note !== undefined ? { note: action.note } : {}),
                  }
            ),
          })),
        })),
      };
  }
}

type Store = {
  loaded: boolean;
  goals: Goal[];
  getGoal: (id: string) => Goal | undefined;
  addGoal: (input: Pick<Goal, 'title' | 'why' | 'context' | 'targetDate'>) => string;
  deleteGoal: (goalId: string) => void;
  toggleStep: (goalId: string, milestoneId: string, stepId: string) => void;
  addStep: (goalId: string, milestoneId: string, title: string) => void;
  addMilestone: (goalId: string, title: string) => void;
  /** Replaces the goal's milestones with an AI plan the user accepted. */
  applyPlan: (goalId: string, plan: DraftMilestone[]) => void;
  /** "Did a little today" on a busy or low-energy day. Tapping again undoes it. */
  toggleEffortToday: (goalId: string) => void;
  /** Take today off this goal. Tapping again undoes it. */
  toggleRestToday: (goalId: string) => void;
  reflect: (goalId: string, stepId: string, reflection: { feeling?: Feeling; note?: string }) => void;
};

const GoalsContext = createContext<Store | null>(null);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { loaded: false, goals: [] });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'loaded', goals: raw ? (JSON.parse(raw) as Goal[]) : seedGoals }))
      .catch(() => dispatch({ type: 'loaded', goals: seedGoals }));
  }, []);

  useEffect(() => {
    if (state.loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.goals)).catch(() => {});
    }
  }, [state]);

  const store: Store = {
    loaded: state.loaded,
    goals: state.goals,
    getGoal: (id) => state.goals.find((g) => g.id === id),
    addGoal: (input) => {
      const id = newId();
      dispatch({
        type: 'addGoal',
        goal: {
          ...input,
          id,
          status: 'active',
          createdAt: new Date().toISOString(),
          milestones: [],
        },
      });
      return id;
    },
    deleteGoal: (goalId) => dispatch({ type: 'deleteGoal', goalId }),
    toggleStep: (goalId, milestoneId, stepId) =>
      dispatch({ type: 'toggleStep', goalId, milestoneId, stepId, now: new Date().toISOString() }),
    addStep: (goalId, milestoneId, title) =>
      dispatch({ type: 'addStep', goalId, milestoneId, title, id: newId() }),
    addMilestone: (goalId, title) => dispatch({ type: 'addMilestone', goalId, title, id: newId() }),
    toggleEffortToday: (goalId) =>
      dispatch({ type: 'toggleDay', goalId, field: 'effortDays', day: localDay(new Date()) }),
    toggleRestToday: (goalId) => dispatch({ type: 'toggleDay', goalId, field: 'restDays', day: localDay(new Date()) }),
    reflect: (goalId, stepId, reflection) => dispatch({ type: 'reflect', goalId, stepId, ...reflection }),
    applyPlan: (goalId, plan) =>
      dispatch({
        type: 'setPlan',
        goalId,
        milestones: plan.map((m) => ({
          id: newId(),
          title: m.title,
          steps: m.steps.map((s) => ({ id: newId(), title: s.title, doneCheck: s.doneCheck, doneAt: null, source: 'ai' as const })),
        })),
      }),
  };

  return <GoalsContext.Provider value={store}>{children}</GoalsContext.Provider>;
}

export function useGoals(): Store {
  const store = useContext(GoalsContext);
  if (!store) throw new Error('useGoals must be used inside GoalsProvider');
  return store;
}
