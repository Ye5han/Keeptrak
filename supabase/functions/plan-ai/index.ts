// Keeptrak AI planner: a Supabase Edge Function that asks Claude for
// 3 tailored questions, a step plan, or a 5-minute version of a step.
//
// Secret needed (Supabase dashboard > Edge Functions > Secrets): ANTHROPIC_API_KEY
// The key stays on the server. The app only ever sees the JSON below.
import Anthropic from "npm:@anthropic-ai/sdk@^1.14.0";

const MODEL = Deno.env.get("KEEPTRAK_MODEL") ?? "claude-opus-5-5";
const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Goal = {
  title: string;
  why?: string;
  context?: string;
  targetDate?: string | null;
  dailyMinutes?: number | null;
};
type Answer = { question: string; answer: string | null };

const SYSTEM = `You are the planning coach inside Keeptrak, a goal tracker app.
People set a goal and you turn it into small daily steps they can actually finish.
Write in plain, friendly English that a busy person can read at a glance. No jargon, no emoji.
Plans must survive real life: assume tired days and missed days, not ideal ones.`;

function describe(goal: Goal): string {
  const lines = [`Goal: ${goal.title}`];
  if (goal.why) lines.push(`Why it matters to them: ${goal.why}`);
  if (goal.context) lines.push(`Extra context: ${goal.context}`);
  if (goal.targetDate) lines.push(`Target date: ${goal.targetDate}`);
  if (goal.dailyMinutes) lines.push(`Time they can give most days: ${goal.dailyMinutes} minutes`);
  lines.push(`Today's date: ${new Date().toISOString().slice(0, 10)}`);
  return lines.join("\n");
}

// --- JSON shapes Claude must return (structured outputs) ---
const questionsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "options"],
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

const planSchema = {
  type: "object",
  additionalProperties: false,
  required: ["milestones"],
  properties: {
    milestones: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "steps"],
        properties: {
          title: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "doneCheck", "minutes"],
              properties: {
                title: { type: "string" },
                doneCheck: { type: "string" },
                minutes: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
};

const shrinkSchema = {
  type: "object",
  additionalProperties: false,
  required: ["step"],
  properties: { step: { type: "string" } },
};

async function ask<T>(prompt: string, schema: Record<string, unknown>, effort: "low" | "medium"): Promise<T> {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("refused");
  if (response.stop_reason === "max_tokens") throw new Error("cut off");
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("no text");
  return JSON.parse(text.text) as T;
}

const clean = (s: unknown, max = 200) => String(s ?? "").trim().slice(0, max);

async function questions(goal: Goal) {
  const out = await ask<{ questions: { question: string; options: string[] }[] }>(
    `${describe(goal)}

Ask exactly 3 short questions that would most change how you plan THIS goal.
Skip anything the details above already answer. Each question gets 3 short answer options
(2 to 5 words each) that cover the common cases; the person can also type their own answer.`,
    questionsSchema,
    "low",
  );
  return out.questions.slice(0, 3).map((q, i) => ({
    id: `q${i + 1}`,
    question: clean(q.question),
    options: q.options.slice(0, 4).map((o) => clean(o, 60)).filter(Boolean),
  }));
}

async function plan(goal: Goal, answers: Answer[]) {
  const answered = answers
    .map((a) => `- ${a.question} ${a.answer ? a.answer : "(skipped)"}`)
    .join("\n");
  const cap = goal.dailyMinutes ?? 60;
  const out = await ask<{ milestones: { title: string; steps: { title: string; doneCheck: string; minutes: number }[] }[] }>(
    `${describe(goal)}

Their answers:
${answered || "(none)"}

Make a step plan for this goal.
- 3 to 5 milestones, in order. Each milestone title says what is true when it is reached.
- 3 to 6 steps per milestone. Each step is one sitting that fits in a single day.
- Each step's "minutes" is an honest estimate and must be ${cap} or less.
- "doneCheck" is one short sentence saying how they know the step is done.
- Start with an easy first step they could do today.
- Fit the whole plan before the target date if there is one.
- Use their answers; if they mentioned limits (injury, busy weeks), plan around them.`,
    planSchema,
    "medium",
  );
  return out.milestones.slice(0, 6).map((m) => ({
    title: clean(m.title, 120),
    steps: m.steps.slice(0, 8).map((s) => ({
      title: clean(s.title, 160),
      doneCheck: clean(s.doneCheck, 160),
      minutes: Math.max(5, Math.min(cap, Math.round(Number(s.minutes) || 15))),
    })),
  })).filter((m) => m.steps.length > 0);
}

async function shrink(goal: Goal, step: { title: string; doneCheck?: string }) {
  const out = await ask<{ step: string }>(
    `${describe(goal)}

Today's step: ${step.title}${step.doneCheck ? `\nDone when: ${step.doneCheck}` : ""}

They are low on energy today. Write a 5-minute version of this step: one sentence,
starting with a verb, that still moves the goal forward and is easy to start right now.`,
    shrinkSchema,
    "low",
  );
  return clean(out.step, 200);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: { action?: string; goal?: Goal; answers?: Answer[]; step?: { title: string; doneCheck?: string } };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad JSON" }, 400);
  }
  const goal = body.goal;
  if (!goal || typeof goal.title !== "string" || !goal.title.trim()) {
    return json({ error: "Missing goal" }, 400);
  }
  goal.title = clean(goal.title);
  goal.why = clean(goal.why, 500);
  goal.context = clean(goal.context, 1000);

  try {
    switch (body.action) {
      case "questions":
        return json({ questions: await questions(goal) });
      case "plan":
        return json({ milestones: await plan(goal, (body.answers ?? []).slice(0, 5)) });
      case "shrink":
        if (!body.step?.title) return json({ error: "Missing step" }, 400);
        return json({ step: await shrink(goal, body.step) });
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error(err);
    return json({ error: "AI unavailable" }, 502);
  }
});
