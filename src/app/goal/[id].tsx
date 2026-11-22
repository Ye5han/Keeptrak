import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Gauge } from '@/components/gauge';
import { ProgressBar } from '@/components/progress-bar';
import { useGoals } from '@/lib/goals-store';
import { formatTargetDate, goalProgress, milestoneProgress, nextStep } from '@/lib/progress';
import { useColors } from '@/lib/theme';
import type { Milestone } from '@/lib/types';

export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGoal, deleteGoal, addMilestone } = useGoals();
  const colors = useColors();
  const goal = getGoal(id);
  const [milestoneTitle, setMilestoneTitle] = useState('');

  if (!goal) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.muted }}>This goal no longer exists.</Text>
      </View>
    );
  }

  const progress = goalProgress(goal);
  const next = nextStep(goal);

  const confirmDelete = () =>
    Alert.alert('Delete this goal?', 'Its milestones and steps will be removed too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteGoal(goal.id);
          router.back();
        },
      },
    ]);

  const submitMilestone = () => {
    if (!milestoneTitle.trim()) return;
    addMilestone(goal.id, milestoneTitle.trim());
    setMilestoneTitle('');
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable onPress={confirmDelete} accessibilityRole="button" hitSlop={8}>
              <Text style={{ color: colors.danger, fontSize: 15 }}>Delete</Text>
            </Pressable>
          ),
        }}
      />
      <Text style={[styles.title, { color: colors.text }]}>{goal.title}</Text>
      {goal.why ? <Text style={[styles.why, { color: colors.muted }]}>{goal.why}</Text> : null}

      <View style={styles.gaugeRow}>
        <Gauge ratio={progress.ratio} size={200} label={`${goal.title} progress`} />
        <Text style={[styles.meta, { color: colors.muted }]}>
          {progress.done} of {progress.total} steps done · {formatTargetDate(goal.targetDate)}
        </Text>
        {next && (
          <Text style={[styles.next, { color: colors.text }]}>
            Next step: <Text style={{ fontWeight: '600' }}>{next.step.title}</Text>
          </Text>
        )}
      </View>

      {goal.milestones.map((m) => (
        <MilestoneCard key={m.id} goalId={goal.id} milestone={m} />
      ))}

      <View style={[styles.addRow, { borderColor: colors.border }]}>
        <TextInput
          style={[styles.addInput, { color: colors.text }]}
          value={milestoneTitle}
          onChangeText={setMilestoneTitle}
          placeholder="Add a milestone"
          placeholderTextColor={colors.muted}
          onSubmitEditing={submitMilestone}
          returnKeyType="done"
        />
        <Pressable onPress={submitMilestone} accessibilityRole="button" hitSlop={8}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>Add</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function MilestoneCard({ goalId, milestone }: { goalId: string; milestone: Milestone }) {
  const { toggleStep, addStep } = useGoals();
  const colors = useColors();
  const progress = milestoneProgress(milestone);
  const [stepTitle, setStepTitle] = useState('');

  const submitStep = () => {
    if (!stepTitle.trim()) return;
    addStep(goalId, milestone.id, stepTitle.trim());
    setStepTitle('');
  };

  return (
    <View style={[styles.milestone, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.milestoneHeader}>
        <Text style={[styles.milestoneTitle, { color: colors.text }]}>{milestone.title}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {progress.done}/{progress.total}
        </Text>
      </View>
      <ProgressBar ratio={progress.ratio} />
      {milestone.steps.map((s) => {
        const done = s.doneAt !== null;
        return (
          <Pressable
            key={s.id}
            style={styles.step}
            onPress={() => toggleStep(goalId, milestone.id, s.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}>
            <View
              style={[
                styles.box,
                { borderColor: done ? colors.done : colors.muted, backgroundColor: done ? colors.done : 'transparent' },
              ]}>
              {done && <Text style={styles.tick}>✓</Text>}
            </View>
            <Text
              style={[
                styles.stepText,
                { color: done ? colors.muted : colors.text, textDecorationLine: done ? 'line-through' : 'none' },
              ]}>
              {s.title}
            </Text>
          </Pressable>
        );
      })}
      <View style={styles.addStepRow}>
        <TextInput
          style={[styles.addInput, { color: colors.text }]}
          value={stepTitle}
          onChangeText={setStepTitle}
          placeholder="Add a step"
          placeholderTextColor={colors.muted}
          onSubmitEditing={submitStep}
          returnKeyType="done"
        />
        <Pressable onPress={submitStep} accessibilityRole="button" hitSlop={8}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { padding: 16, gap: 14, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700' },
  why: { fontSize: 15, marginTop: -6 },
  gaugeRow: { alignItems: 'center', gap: 8, marginVertical: 8 },
  meta: { fontSize: 14 },
  next: { fontSize: 15, textAlign: 'center' },
  milestone: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  milestoneTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  stepText: { fontSize: 15, flex: 1 },
  addStepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, paddingHorizontal: 14 },
  addInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
});
