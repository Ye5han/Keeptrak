import { Link, Redirect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Gauge } from '@/components/gauge';
import { Logo } from '@/components/logo';
import { TodayCard } from '@/components/today-card';
import { bandOf, disciplineScore, localDay, type Band } from '@/lib/discipline';
import { useGoals } from '@/lib/goals-store';
import { formatTargetDate, goalProgress, nextStep, overallProgress } from '@/lib/progress';
import { useColors } from '@/lib/theme';
import type { Goal } from '@/lib/types';

export default function HomeScreen() {
  const { loaded, goals, profile } = useGoals();
  const colors = useColors();

  if (loaded && !profile.onboarded) {
    return <Redirect href="/welcome" />;
  }

  if (!loaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <GoalCard goal={item} />}
        ListHeaderComponent={<HomeHeader goals={goals} name={profile.name} />}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>What do you want to achieve?</Text>
            <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center' }}>
              Add your first goal and Keeptrak will break it into small daily steps.
            </Text>
          </View>
        }
      />
      <Link href="/new-goal" asChild>
        <Pressable
          style={StyleSheet.flatten([styles.fab, { backgroundColor: colors.accent }])}
          accessibilityRole="button">
          <Text style={styles.fabText}>+ New goal</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function HomeHeader({ goals, name }: { goals: Goal[]; name: string }) {
  const colors = useColors();
  const open = goals.filter((g) => {
    const p = goalProgress(g);
    return p.total === 0 || p.done < p.total;
  });
  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const movedToday = open.filter((g) => isMovedToday(g)).length;
  const sub =
    goals.length === 0
      ? 'Let us set your first goal.'
      : open.length === 0
        ? 'Every goal is complete. Time for a new one?'
        : movedToday === open.length
          ? 'Every goal moved forward today. Nice work.'
          : movedToday === 0
            ? `${open.length === 1 ? 'Your goal is' : `${open.length} goals are`} waiting for today's step.`
            : `${movedToday} of ${open.length} goals moved forward today. Keep going.`;

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.brandRow}>
        <Logo colors={colors} size={26} />
        <Text style={[styles.brand, { color: colors.text }]}>Keeptrak</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ color: colors.muted, fontSize: 13 }}>{dateLabel}</Text>
      </View>
      <View style={{ gap: 4, marginTop: 6 }}>
        <Text style={[styles.h1, { color: colors.text }]}>
          {greeting(now)}
          {name ? `, ${name}` : ''}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15 }}>{sub}</Text>
      </View>
      {open.length > 0 && <Text style={[styles.section, { color: colors.text }]}>Today</Text>}
      {open.map((g) => (
        <TodayCard key={g.id} goal={g} />
      ))}
      {goals.length > 0 && <SummaryCard goals={goals} />}
      {goals.length > 0 && <Text style={[styles.section, { color: colors.text }]}>Your goals</Text>}
    </View>
  );
}

function isMovedToday(goal: Goal): boolean {
  const today = localDay(new Date());
  const ticked = goal.milestones.some((m) => m.steps.some((s) => s.doneAt && localDay(new Date(s.doneAt)) === today));
  return ticked || (goal.effortDays ?? []).includes(today);
}

const BAND_TEXT: Record<Band, string> = {
  red: 'Slipping',
  yellow: 'Getting there',
  green: 'On track',
};

function SummaryCard({ goals }: { goals: Goal[] }) {
  const colors = useColors();
  const overall = overallProgress(goals);
  const score = disciplineScore(goals);
  const tone = (band: Band | null) => (band ? colors[band] : colors.track);
  const dayLetter = (day: string) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'].at(new Date(`${day}T12:00:00`).getDay());

  return (
    <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.gauges}>
        <View style={styles.gaugeBox}>
          <Text style={[styles.label, { color: colors.muted }]}>ALL GOALS</Text>
          <Gauge ratio={overall.ratio} size={130} label="Overall progress across all goals" />
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {overall.stepsDone}/{overall.stepsTotal} steps
          </Text>
        </View>
        <View style={styles.gaugeBox}>
          <Text style={[styles.label, { color: colors.muted }]}>DISCIPLINE</Text>
          <Gauge
            ratio={score.ratio ?? 0}
            size={130}
            color={tone(score.band)}
            centerText={score.ratio === null ? '–' : undefined}
            label="Discipline score, last 7 days"
          />
          <Text style={{ color: score.band ? colors[score.band] : colors.muted, fontSize: 13, fontWeight: '600' }}>
            {score.band ? BAND_TEXT[score.band] : 'Starts with your first tick'}
          </Text>
        </View>
      </View>
      <View style={styles.days}>
        {score.days.map((d) => (
          <View key={d.day} style={styles.day}>
            <View
              style={[styles.dot, { backgroundColor: d.active === 0 ? colors.track : tone(bandOf(d.hit / d.active)) }]}
            />
            <Text style={{ color: colors.muted, fontSize: 12 }}>{dayLetter(d.day)}</Text>
          </View>
        ))}
      </View>
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
        <Gauge ratio={progress.ratio} size={84} label={`${goal.title} progress`} />
        <View style={styles.cardBody}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {goal.title}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {progress.done} of {progress.total} steps · {formatTargetDate(goal.targetDate)}
          </Text>
          {!next && progress.total > 0 ? (
            <Text style={[styles.meta, { color: colors.green }]}>Complete</Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 96 },
  h1: { fontSize: 28, fontWeight: '700' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  brand: { fontSize: 17, fontWeight: '700' },
  emptyCard: { borderWidth: 1, borderRadius: 16, padding: 24, gap: 8, alignItems: 'center', marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  summary: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12, marginTop: 8 },
  gauges: { flexDirection: 'row', justifyContent: 'space-around' },
  gaugeBox: { alignItems: 'center', gap: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  days: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  day: { alignItems: 'center', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  section: { fontSize: 17, fontWeight: '600', marginTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 14, borderWidth: 1 },
  cardBody: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13 },
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
