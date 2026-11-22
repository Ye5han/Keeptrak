import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Gauge } from '@/components/gauge';
import { useGoals } from '@/lib/goals-store';
import { formatTargetDate, goalProgress, nextStep, overallProgress } from '@/lib/progress';
import { useColors } from '@/lib/theme';
import type { Goal } from '@/lib/types';

export default function HomeScreen() {
  const { loaded, goals } = useGoals();
  const colors = useColors();

  if (!loaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <GoalCard goal={item} />}
        ListHeaderComponent={goals.length > 0 ? <OverallCard goals={goals} /> : undefined}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.muted }]}>
            No goals yet. Tap New goal to set your first one.
          </Text>
        }
      />
      <Link href="/new-goal" asChild>
        <Pressable style={StyleSheet.flatten([styles.fab, { backgroundColor: colors.accent }])} accessibilityRole="button">
          <Text style={styles.fabText}>+ New goal</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function OverallCard({ goals }: { goals: Goal[] }) {
  const colors = useColors();
  const overall = overallProgress(goals);
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.overall, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.overallLabel, { color: colors.muted }]}>OVERALL PROGRESS</Text>
        <Gauge ratio={overall.ratio} size={220} label="Overall progress across all goals" />
        <View style={styles.stats}>
          <Stat value={String(overall.goals)} label={overall.goals === 1 ? 'goal' : 'goals'} />
          <Stat value={String(overall.completedGoals)} label="complete" />
          <Stat value={`${overall.stepsDone}/${overall.stepsTotal}`} label="steps done" />
        </View>
      </View>
      <Text style={[styles.section, { color: colors.text }]}>Your goals</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const colors = useColors();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const colors = useColors();
  const progress = goalProgress(goal);
  const next = nextStep(goal);

  return (
    <Link href={{ pathname: '/goal/[id]', params: { id: goal.id } }} asChild>
      <Pressable
        style={StyleSheet.flatten([styles.card, { backgroundColor: colors.card, borderColor: colors.border }])}
        accessibilityRole="button">
        <Gauge ratio={progress.ratio} size={96} label={`${goal.title} progress`} />
        <View style={styles.cardBody}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {goal.title}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {progress.done} of {progress.total} steps · {formatTargetDate(goal.targetDate)}
          </Text>
          <Text style={[styles.next, { color: colors.text }]} numberOfLines={2}>
            {next ? `Next: ${next.step.title}` : progress.total > 0 ? 'All steps done' : 'Add your first step'}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overall: { borderWidth: 1, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 14, alignItems: 'center', gap: 10 },
  overallLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  stats: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around', marginTop: 4 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  section: { fontSize: 17, fontWeight: '600', marginTop: 8 },
  list: { padding: 16, gap: 12, paddingBottom: 96 },
  empty: { textAlign: 'center', marginTop: 48, fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardBody: { flex: 1, gap: 4 },
  title: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 13 },
  next: { fontSize: 14, marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 3,
  },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
