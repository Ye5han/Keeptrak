/**
 * The AI step planner.
 *
 * For now this is a sample planner that runs on the phone, so the question and plan screens can be
 * tried before the real AI is connected. In weeks 3-4 `planner` will call a server function that asks
 * Claude, with the same inputs and outputs.
 */

export type GoalInput = {
  title: string;
  why: string;
  context: string;
  targetDate: string | null;
};

export type PlanQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type PlanAnswer = { questionId: string; question: string; answer: string | null };

export type DraftStep = { title: string; doneCheck: string };
export type DraftMilestone = { title: string; steps: DraftStep[] };

export interface Planner {
  getQuestions(goal: GoalInput): Promise<PlanQuestion[]>;
  getPlan(goal: GoalInput, answers: PlanAnswer[]): Promise<DraftMilestone[]>;
}

type Kind = 'fitness' | 'learning' | 'building' | 'money' | 'general';

const KEYWORDS: [Kind, RegExp][] = [
  ['fitness', /\b(run|marathon|5k|10k|gym|fit|fitness|weight|muscle|swim|cycle|walk|workout|strength)\w*/i],
  ['learning', /\b(learn|study|exam|course|language|degree|read|certif|skill|practi[cs]e|guitar|piano|code|coding)\w*/i],
  ['building', /\b(build|launch|app|website|business|startup|product|ship|release|open|start a|write a book|podcast|channel)\w*/i],
  ['money', /\b(save|saving|money|debt|budget|invest|deposit|income|\$|dollars?)\w*/i],
];

function kindOf(goal: GoalInput): Kind {
  const text = `${goal.title} ${goal.why} ${goal.context}`;
  return KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? 'general';
}

const QUESTIONS: Record<Kind, PlanQuestion[]> = {
  fitness: [
    { id: 'level', question: 'Where are you starting from?', options: ['Just starting out', 'Train now and then', 'Train most weeks'] },
    { id: 'time', question: 'How many sessions a week can you do?', options: ['2', '3 to 4', '5 or more'] },
    { id: 'limits', question: 'Anything that could get in the way?', options: ['An old injury', 'Busy schedule', 'Nothing major'] },
  ],
  learning: [
    { id: 'level', question: 'How much do you already know?', options: ['Complete beginner', 'Know the basics', 'Fairly confident'] },
    { id: 'time', question: 'How many hours a week can you study?', options: ['1 to 2', '3 to 5', '6 or more'] },
    { id: 'style', question: 'How do you learn best?', options: ['Videos and courses', 'Books and notes', 'Doing it hands-on'] },
  ],
  building: [
    { id: 'level', question: 'How far along are you?', options: ['Just an idea', 'Planned it out', 'Already started'] },
    { id: 'time', question: 'How many hours a week can you put in?', options: ['Under 5', '5 to 15', 'More than 15'] },
    { id: 'help', question: 'Will you do it alone or with help?', options: ['On my own', 'With a friend or team', 'Paying someone for parts'] },
  ],
  money: [
    { id: 'level', question: 'Do you track your spending today?', options: ['Not really', 'Roughly', 'Yes, closely'] },
    { id: 'time', question: 'How much could you set aside each month?', options: ['A little', 'A fair amount', 'Not sure yet'] },
    { id: 'limits', question: 'What usually gets in the way?', options: ['Unexpected bills', 'Impulse spending', 'Irregular income'] },
  ],
  general: [
    { id: 'level', question: 'Where are you starting from?', options: ['From scratch', 'Made a start', 'Partway there'] },
    { id: 'time', question: 'How many hours a week can you give it?', options: ['1 to 2', '3 to 5', '6 or more'] },
    { id: 'limits', question: 'What is most likely to slow you down?', options: ['Time', 'Not knowing how', 'Staying motivated'] },
  ],
};

const step = (title: string, doneCheck: string): DraftStep => ({ title, doneCheck });

function plansFor(kind: Kind, goal: GoalInput, answer: (id: string) => string | null): DraftMilestone[] {
  const beginner = /just|complete beginner|from scratch|not really|idea/i.test(answer('level') ?? '');
  const light = /^(2|1 to 2|under 5|a little)$/i.test(answer('time') ?? '');
  const g = goal.title;
  switch (kind) {
    case 'fitness':
      return [
        {
          title: 'Set your baseline',
          steps: [
            step(beginner ? 'Do a 20-minute easy walk-run' : 'Do one easy session at your normal effort', 'Session logged with time and how it felt'),
            step('Pick fixed days and times for each session', 'Sessions are in your calendar'),
            ...(answer('limits') === 'An old injury' ? [step('Check the injury with a physio or GP', 'You know what to avoid')] : []),
          ],
        },
        {
          title: 'Build the habit',
          steps: [
            step(light ? 'Complete 2 sessions this week' : 'Complete 3 sessions this week', 'All sessions ticked off'),
            step('Add 10% to your longest session', 'Longest session is 10% longer than last week'),
            step('Take one full rest day', 'A rest day with no training'),
          ],
        },
        {
          title: 'Increase the challenge',
          steps: [
            step('Add one harder session a week', 'One session at a pace or weight that feels hard'),
            step('Repeat your baseline test', 'Result beats your first baseline'),
          ],
        },
        {
          title: `Get ready for: ${g}`,
          steps: [
            step('Do a full rehearsal at 80% of the target', 'Rehearsal finished without stopping'),
            step('Ease off training in the final week', 'Final week sessions are shorter'),
            step(`Do it: ${g}`, 'Goal reached'),
          ],
        },
      ];
    case 'learning':
      return [
        {
          title: 'Get set up',
          steps: [
            step(answer('style') === 'Books and notes' ? 'Choose one main book or guide' : answer('style') === 'Doing it hands-on' ? 'Choose a small practice project' : 'Choose one main course', 'You have one main resource picked'),
            step('Block your study times for the week', 'Study times are in your calendar'),
            ...(beginner ? [step('Learn the 10 core terms or basics', 'You can explain each one in a sentence')] : [step('Take a quick self-test to find your gaps', 'You have a list of weak spots')]),
          ],
        },
        {
          title: 'Learn the foundations',
          steps: [
            step(light ? 'Finish the first 2 lessons or chapters' : 'Finish the first 4 lessons or chapters', 'Lessons marked complete'),
            step('Write a one-page summary from memory', 'Summary written without looking'),
            step('Practise for 20 minutes on what felt hardest', 'Practice session done'),
          ],
        },
        {
          title: 'Practise for real',
          steps: [
            step('Do one realistic exercise, test or project', 'Exercise finished and checked'),
            step('Fix the mistakes from it', 'Each mistake redone correctly'),
          ],
        },
        {
          title: `Reach the goal: ${g}`,
          steps: [
            step('Do a full practice run of the final test or task', 'Practice run completed'),
            step(`Do it: ${g}`, 'Goal reached'),
          ],
        },
      ];
    case 'building':
      return [
        {
          title: 'Define it',
          steps: [
            ...(beginner ? [step('Write one sentence on who it is for and what it does', 'Sentence written and shown to one person')] : []),
            step('List the 3 to 5 must-have features', 'List written, everything else marked "later"'),
            step('Talk to 3 people who would use it', 'Notes from 3 conversations'),
          ],
        },
        {
          title: 'Make the first version',
          steps: [
            step(answer('help') === 'On my own' ? 'Pick tools you can use alone' : 'Agree who does which part', answer('help') === 'On my own' ? 'Tools chosen' : 'Each part has an owner'),
            step(light ? 'Build the single most important feature' : 'Build the must-have features', 'Feature works end to end'),
            step('Get one person to try it while you watch', 'One test session done, notes taken'),
          ],
        },
        {
          title: 'Test with real people',
          steps: [
            step('Share it with 10 people', '10 people have access'),
            step('Collect feedback and pick the top 3 fixes', 'Top 3 fixes listed'),
            step('Make the top 3 fixes', 'Fixes done'),
          ],
        },
        {
          title: `Launch: ${g}`,
          steps: [
            step('Write a short launch message', 'Message ready to post'),
            step(`Do it: ${g}`, 'Live and shared'),
          ],
        },
      ];
    case 'money':
      return [
        {
          title: 'Know your numbers',
          steps: [
            step(beginner ? 'Write down last month\'s spending from your bank app' : 'Review last month\'s spending', 'Spending total by category'),
            step('Set the exact amount and date for this goal', 'Amount and date written down'),
          ],
        },
        {
          title: 'Set up the system',
          steps: [
            step('Open a separate account or pot for this goal', 'Account or pot exists'),
            step('Set an automatic transfer on payday', 'Transfer scheduled'),
            ...(answer('limits') === 'Impulse spending' ? [step('Add a 24-hour wait rule for non-essentials', 'Rule written where you will see it')] : []),
            ...(answer('limits') === 'Unexpected bills' ? [step('Start a small buffer for surprise bills', 'Buffer amount set aside')] : []),
          ],
        },
        {
          title: 'Stay on track',
          steps: [
            step('Do a 10-minute money check each week', 'Four weekly checks done'),
            step('Cut or cancel one regular cost', 'One cost cancelled'),
          ],
        },
        {
          title: `Reach the goal: ${g}`,
          steps: [step(`Do it: ${g}`, 'Target amount reached')],
        },
      ];
    default:
      return [
        {
          title: 'Get clear',
          steps: [
            step('Describe what "done" looks like in one sentence', 'Sentence written'),
            step('List everything you need to get there', 'List written'),
            ...(answer('limits') === 'Not knowing how' ? [step('Find one person or guide who has done it', 'One source found')] : []),
          ],
        },
        {
          title: 'Make a start',
          steps: [
            step(light ? 'Spend 1 hour on the easiest item' : 'Spend 2 hours on the most important item', 'Time spent and logged'),
            step('Book regular time for it each week', 'Time is in your calendar'),
          ],
        },
        {
          title: 'Keep going',
          steps: [
            step('Finish half of the list', 'Half the items done'),
            step('Review what is working and adjust', 'One change made'),
          ],
        },
        {
          title: `Finish: ${g}`,
          steps: [step(`Do it: ${g}`, 'Goal reached')],
        },
      ];
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const samplePlanner: Planner = {
  async getQuestions(goal) {
    await wait(700);
    return QUESTIONS[kindOf(goal)];
  },
  async getPlan(goal, answers) {
    await wait(1200);
    const answer = (id: string) => answers.find((a) => a.questionId === id)?.answer ?? null;
    return plansFor(kindOf(goal), goal, answer);
  },
};

export const planner: Planner = samplePlanner;
