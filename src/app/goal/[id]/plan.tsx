import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { planner, type DraftMilestone, type GoalInput, type PlanAnswer, type PlanQuestion } from '@/lib/ai';
import { useGoals } from '@/lib/goals-store';
import { formatMinutes } from '@/lib/progress';
import { useColors, type Colors } from '@/lib/theme';

type Phase =
  | { kind: 'loadingQuestions' }
  | { kind: 'asking'; questions: PlanQuestion[]; index: number }
  | { kind: 'planning' }
  | { kind: 'review'; plan: DraftMilestone[] }
  | { kind: 'error' };

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGoal, applyPlan } = useGoals();
  const colors = useColors();
  const goal = getGoal(id);
  const [phase, setPhase] = useState<Phase>({ kind: 'loadingQuestions' });
  const [answers, setAnswers] = useState<PlanAnswer[]>([]);
  const [typed, setTyped] = useState('');

  const input: GoalInput | null = goal
    ? { title: goal.title, why: goal.why, context: goal.context, targetDate: goal.targetDate, dailyMinutes: goal.dailyMinutes ?? null }
    : null;

  useEffect(() => {
    if (!input) return;
    planner
      .getQuestions(input)
      .then((questions) => setPhase({ kind: 'asking', questions, index: 0 }))
      .catch(() => setPhase({ kind: 'error' }));
    // Ask once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!goal || !input) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.muted }}>This goal no longer exists.</Text>
      </View>
    );
  }

  const buildPlan = (all: PlanAnswer[]) => {
    setPhase({ kind: 'planning' });
    planner
      .getPlan(input, all)
      .then((plan) => setPhase({ kind: 'review', plan }))
      .catch(() => setPhase({ kind: 'error' }));
  };

  const answer = (value: string | null) => {
    if (phase.kind !== 'asking') return;
    const q = phase.questions[phase.index];
    const next = [...answers.filter((a) => a.questionId !== q.id), { questionId: q.id, question: q.question, answer: value }];
    setAnswers(next);
    setTyped('');
    if (phase.index + 1 < phase.questions.length) {
      setPhase({ ...phase, index: phase.index + 1 });
    } else {
      buildPlan(next);
    }
  };

  if (phase.kind === 'loadingQuestions' || phase.kind === 'planning') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={[styles.loading, { color: colors.muted }]}>
          {phase.kind === 'loadingQuestions' ? 'Thinking about your goal…' : 'Building your step plan…'}
        </Text>
        {phase.kind === 'planning' && (
          <Text style={[styles.loadingHint, { color: colors.muted }]}>This can take up to a minute.</Text>
        )}
      </View>
    );
  }

  if (phase.kind === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.text, marginBottom: 12 }}>Something went wrong making your plan.</Text>
        <PrimaryButton colors={colors} label="Try again" onPress={() => buildPlan(answers)} />
      </View>
    );
  }

  if (phase.kind === 'asking') {
    const q = phase.questions[phase.index];
    return (
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Text style={[styles.counter, { color: colors.muted }]}>
          Question {phase.index + 1} of {phase.questions.length} · {goal.title}
        </Text>
        <Text style={[styles.question, { color: colors.text }]}>{q.question}</Text>
        <View style={styles.options}>
          {q.options.map((option) => (
            <Pressable
              key={option}
              onPress={() => answer(option)}
              accessibilityRole="button"
              style={[styles.option, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.typedRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.typedInput, { color: colors.text }]}
            value={typed}
            onChangeText={setTyped}
            placeholder="Or type your own answer"
            placeholderTextColor={colors.muted}
            onSubmitEditing={() => typed.trim() && answer(typed.trim())}
            returnKeyType="next"
          />
          <Pressable onPress={() => typed.trim() && answer(typed.trim())} accessibilityRole="button" hitSlop={8}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Next</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => answer(null)} accessibilityRole="button" style={styles.skip}>
          <Text style={{ color: colors.muted, fontSize: 15 }}>Skip this question</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const stepCount = phase.plan.reduce((n, m) => n + m.steps.length, 0);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={[styles.question, { color: colors.text }]}>Your step plan</Text>
      <Text style={{ color: colors.muted, fontSize: 14 }}>
        {phase.plan.length} milestones, {stepCount} steps. You can edit any of it after you save.
      </Text>
      {phase.plan.map((m, i) => (
        <View key={i} style={[styles.milestone, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.milestoneTitle, { color: colors.text }]}>{m.title}</Text>
          {m.steps.map((s, j) => (
            <View key={j} style={styles.step}>
              <Text style={[styles.bullet, { color: colors.accent }]}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15 }}>{s.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {formatMinutes(s.minutes)} · Done when: {s.doneCheck}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      <PrimaryButton
        colors={colors}
        label="Use this plan"
        onPress={() => {
          applyPlan(goal.id, phase.plan);
          router.back();
        }}
      />
      <Pressable
        onPress={() => {
          setAnswers([]);
          setPhase({ kind: 'loadingQuestions' });
          planner
            .getQuestions(input)
            .then((questions) => setPhase({ kind: 'asking', questions, index: 0 }))
            .catch(() => setPhase({ kind: 'error' }));
        }}
        accessibilityRole="button"
        style={styles.skip}>
        <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>Answer the questions again</Text>
      </Pressable>
      {goal.milestones.length > 0 && (
        <Text style={[styles.note, { color: colors.muted }]}>Using this plan replaces the goal's current steps.</Text>
      )}
    </ScrollView>
  );
}

function PrimaryButton({ colors, label, onPress }: { colors: Colors; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.button, { backgroundColor: colors.accent }]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loading: { marginTop: 16, fontSize: 15 },
  loadingHint: { marginTop: 6, fontSize: 13 },
  page: { padding: 20, gap: 14, paddingBottom: 48 },
  counter: { fontSize: 13 },
  question: { fontSize: 22, fontWeight: '700' },
  options: { gap: 10, marginTop: 4 },
  option: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
  optionText: { fontSize: 16 },
  typedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
  typedInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  skip: { alignItems: 'center', paddingVertical: 10 },
  milestone: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  milestoneTitle: { fontSize: 16, fontWeight: '600' },
  step: { flexDirection: 'row', gap: 10 },
  bullet: { fontSize: 18, lineHeight: 20 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  note: { fontSize: 13, textAlign: 'center' },
});
