import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { canRest, localDay } from '@/lib/discipline';
import { useGoals } from '@/lib/goals-store';
import { nextStep } from '@/lib/progress';
import { useColors, type Colors } from '@/lib/theme';
import type { Feeling, Goal, Step } from '@/lib/types';

const FEELINGS: { value: Feeling; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'ok', label: 'OK' },
  { value: 'hard', label: 'Hard' },
];

/** One goal's next action for today: tick it, log a little effort, or take a rest day. */
export function TodayCard({ goal }: { goal: Goal }) {
  const { toggleStep, toggleEffortToday, toggleRestToday, reflect } = useGoals();
  const colors = useColors();
  const [justDone, setJustDone] = useState<{ milestoneId: string; step: Step } | null>(null);
  const [note, setNote] = useState('');

  const today = localDay(new Date());
  const steps = goal.milestones.flatMap((m) => m.steps);
  const next = nextStep(goal);
  const tickedToday = steps.some((s) => s.doneAt && localDay(new Date(s.doneAt)) === today);
  const littleToday = (goal.effortDays ?? []).includes(today);
  const restingToday = (goal.restDays ?? []).includes(today);
  const movedToday = tickedToday || littleToday;
  const reflected = justDone ? steps.find((s) => s.id === justDone.step.id) : undefined;

  const card = [styles.card, { backgroundColor: colors.card, borderColor: movedToday ? colors.green : colors.border }];

  const header = (
    <View style={styles.header}>
      <Text style={[styles.goalTitle, { color: colors.muted }]} numberOfLines={1}>
        {goal.title}
      </Text>
      {movedToday && <Text style={[styles.badge, { color: colors.green }]}>✓ Moved forward today</Text>}
    </View>
  );

  if (steps.length === 0) {
    return (
      <View style={card}>
        {header}
        <Link href={{ pathname: '/goal/[id]/plan', params: { id: goal.id } }} asChild>
          <Pressable accessibilityRole="button">
            <Text style={[styles.stepTitle, { color: colors.accent }]}>Get your step plan →</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (restingToday && !movedToday) {
    return (
      <View style={card}>
        {header}
        <Text style={[styles.stepTitle, { color: colors.text }]}>Resting today</Text>
        <Text style={{ color: colors.muted, fontSize: 14 }}>This won't count against your discipline score.</Text>
        <SmallButton colors={colors} label="Undo rest day" onPress={() => toggleRestToday(goal.id)} />
      </View>
    );
  }

  return (
    <View style={card}>
      {header}

      {justDone && reflected ? (
        <View style={{ gap: 10 }}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Nice. How did "{reflected.title}" feel?</Text>
          <View style={styles.row}>
            {FEELINGS.map((f) => (
              <Chip
                key={f.value}
                colors={colors}
                label={f.label}
                active={reflected.feeling === f.value}
                onPress={() => reflect(goal.id, reflected.id, { feeling: f.value })}
              />
            ))}
          </View>
          <View style={[styles.noteRow, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.noteInput, { color: colors.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.muted}
              onSubmitEditing={() => {
                reflect(goal.id, reflected.id, { note: note.trim() });
                setJustDone(null);
                setNote('');
              }}
            />
          </View>
          {reflected.feeling === 'hard' && (
            <Link href={{ pathname: '/goal/[id]/plan', params: { id: goal.id } }} asChild>
              <Pressable accessibilityRole="button">
                <Text style={{ color: colors.accent, fontSize: 14 }}>
                  Steps feeling too big? Redo the plan with smaller steps →
                </Text>
              </Pressable>
            </Link>
          )}
          <SmallButton
            colors={colors}
            label={next ? 'Done, show my next step' : 'Done'}
            onPress={() => {
              if (note.trim()) reflect(goal.id, reflected.id, { note: note.trim() });
              setJustDone(null);
              setNote('');
            }}
          />
        </View>
      ) : next ? (
        <View style={{ gap: 10 }}>
          <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{next.step.title}</Text>
            {next.step.doneCheck ? (
              <Text style={{ color: colors.muted, fontSize: 13 }}>Done when: {next.step.doneCheck}</Text>
            ) : null}
          </View>
          <View style={styles.row}>
            <Pressable
              onPress={() => {
                toggleStep(goal.id, next.milestone.id, next.step.id);
                setJustDone({ milestoneId: next.milestone.id, step: next.step });
              }}
              accessibilityRole="button"
              style={[styles.primary, { backgroundColor: colors.accent }]}>
              <Text style={styles.primaryText}>✓ Done</Text>
            </Pressable>
            <Chip
              colors={colors}
              label={littleToday ? '✓ Did a little' : 'Did a little'}
              active={littleToday}
              onPress={() => toggleEffortToday(goal.id)}
            />
            {!movedToday && canRest(goal) && (
              <Chip colors={colors} label="Rest day" active={false} onPress={() => toggleRestToday(goal.id)} />
            )}
          </View>
        </View>
      ) : (
        <Text style={[styles.stepTitle, { color: colors.green }]}>Goal complete. Every step is done.</Text>
      )}
    </View>
  );
}

function Chip({ colors, label, active, onPress }: { colors: Colors; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.track : 'transparent' },
      ]}>
      <Text style={{ color: colors.text, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({ colors, label, onPress }: { colors: Colors; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.small}>
      <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 14, padding: 14, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  goalTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  badge: { fontSize: 12, fontWeight: '600' },
  stepTitle: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  primary: { borderRadius: 20, paddingVertical: 9, paddingHorizontal: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  chip: { borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  noteRow: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 },
  noteInput: { fontSize: 15, paddingVertical: 9 },
  small: { alignSelf: 'flex-start', paddingVertical: 4 },
});
