import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useGoals } from '@/lib/goals-store';
import { isValidIsoDate } from '@/lib/progress';
import { useColors } from '@/lib/theme';

export default function NewGoalScreen() {
  const { addGoal } = useGoals();
  const colors = useColors();
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [context, setContext] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const trimmedDate = targetDate.trim();
    if (!title.trim()) return setError('Give your goal a title.');
    if (trimmedDate && !isValidIsoDate(trimmedDate)) return setError('Write the date as YYYY-MM-DD, for example 2027-03-31.');
    const id = addGoal({
      title: title.trim(),
      why: why.trim(),
      context: context.trim(),
      targetDate: trimmedDate || null,
    });
    router.replace({ pathname: '/goal/[id]', params: { id } });
    router.push({ pathname: '/goal/[id]/plan', params: { id } });
  };

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Field label="Goal" colors={colors}>
          <TextInput
            style={inputStyle}
            value={title}
            onChangeText={setTitle}
            placeholder="Run a half marathon"
            placeholderTextColor={colors.muted}
            autoFocus
          />
        </Field>
        <Field label="Why it matters" colors={colors}>
          <TextInput
            style={inputStyle}
            value={why}
            onChangeText={setWhy}
            placeholder="To get fit before summer"
            placeholderTextColor={colors.muted}
          />
        </Field>
        <Field label="Target date (optional)" colors={colors}>
          <TextInput
            style={inputStyle}
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
          />
        </Field>
        <Field label="Where you are now (optional)" colors={colors}>
          <TextInput
            style={[...inputStyle, styles.multiline]}
            value={context}
            onChangeText={setContext}
            placeholder="I can run 5 km and have 4 hours a week"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>
        {error && <Text style={{ color: colors.danger }}>{error}</Text>}
        <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={save} accessibilityRole="button">
          <Text style={styles.buttonText}>Create goal</Text>
        </Pressable>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Next, answer 3 quick questions and the AI will make your step plan.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, colors, children }: { label: string; colors: ReturnType<typeof useColors>; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 20, gap: 18 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 13, textAlign: 'center' },
});
