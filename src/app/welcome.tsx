import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useGoals } from '@/lib/goals-store';
import { Logo } from '@/components/logo';
import { useColors, type Colors } from '@/lib/theme';

const SLIDES = [
  {
    title: 'Set a goal. Get the steps.',
    body: 'Tell Keeptrak what you want to achieve. Answer 3 quick questions and AI breaks it into small steps that fit your day.',
    art: 'plan' as const,
  },
  {
    title: 'One step a day is enough.',
    body: 'Each morning, Today shows the next step for every goal. Busy day? Do a little, or take the 5-minute version.',
    art: 'today' as const,
  },
  {
    title: 'Watch it add up.',
    body: 'Gauges show how far you have come, and your discipline score shows how steadily you are showing up.',
    art: 'gauge' as const,
  },
];

export default function WelcomeScreen() {
  const { finishWelcome, goals } = useGoals();
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const artScale = height < 700 ? 0.7 : 1;
  const pageWidth = Math.min(width, 480);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const [page, setPage] = useState(0);
  const [name, setName] = useState('');
  const pages = SLIDES.length + 1; // the slides, then the name page

  const goTo = (index: number) => {
    scroller.current?.scrollTo({ x: index * pageWidth, animated: true });
    setPage(index);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (index !== page) setPage(index);
  };

  const finish = () => {
    finishWelcome(name);
    router.replace('/');
    if (goals.length === 0) router.push('/new-goal');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <Logo colors={colors} size={28} />
          <Text style={[styles.brand, { color: colors.text }]}>Keeptrak</Text>
          <View style={{ flex: 1 }} />
          {page < SLIDES.length && (
            <Pressable onPress={() => goTo(SLIDES.length)} accessibilityRole="button" hitSlop={8}>
              <Text style={{ color: colors.muted, fontSize: 15 }}>Skip</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          onScroll={Platform.OS === 'web' ? onScroll : undefined}
          scrollEventThrottle={32}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1, alignSelf: 'center', width: pageWidth }}>
          {SLIDES.map((s) => (
            <ScrollView
              key={s.title}
              style={{ width: pageWidth }}
              contentContainerStyle={styles.page}
              showsVerticalScrollIndicator={false}>
              <Art kind={s.art} colors={colors} scale={artScale} />
              <Text style={[styles.title, { color: colors.text }]}>{s.title}</Text>
              <Text style={[styles.body, { color: colors.muted }]}>{s.body}</Text>
            </ScrollView>
          ))}
          <ScrollView
            style={{ width: pageWidth }}
            contentContainerStyle={styles.page}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Logo colors={colors} size={Math.round(96 * artScale)} />
            <Text style={[styles.title, { color: colors.text }]}>What should we call you?</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              value={name}
              onChangeText={setName}
              placeholder="Your first name (optional)"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={finish}
            />
            <Text style={[styles.body, { color: colors.muted }]}>
              No account needed. Your goals stay on this phone.
            </Text>
          </ScrollView>
        </ScrollView>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {Array.from({ length: pages }, (_, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: i === page ? colors.accent : colors.track, width: i === page ? 22 : 8 }]}
              />
            ))}
          </View>
          <Pressable
            onPress={() => (page < pages - 1 ? goTo(page + 1) : finish())}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: colors.accent }]}>
            <Text style={styles.buttonText}>
              {page < pages - 1 ? 'Next' : goals.length === 0 ? 'Set my first goal' : "Let's go"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Art({ kind, colors, scale }: { kind: 'plan' | 'today' | 'gauge'; colors: Colors; scale: number }) {
  const w = Math.round(220 * scale);
  const h = Math.round(170 * scale);
  const card = colors.card;
  const line = colors.track;
  if (kind === 'plan') {
    return (
      <Svg width={w} height={h} viewBox="0 0 220 170">
        <Rect x="20" y="10" width="180" height="150" rx="16" fill={card} stroke={colors.border} />
        <Rect x="40" y="30" width="100" height="12" rx="6" fill={colors.accent} />
        {[62, 92, 122].map((y, i) => (
          <G key={y}>
            <Rect x="40" y={y} width="18" height="18" rx="5" fill={i === 0 ? colors.green : 'none'} stroke={i === 0 ? colors.green : colors.muted} strokeWidth="2" />
            <Rect x="68" y={y + 4} width={i === 2 ? 80 : 110} height="10" rx="5" fill={line} />
          </G>
        ))}
      </Svg>
    );
  }
  if (kind === 'today') {
    return (
      <Svg width={w} height={h} viewBox="0 0 220 170">
        {[10, 92].map((y, i) => (
          <G key={y}>
            <Rect x="20" y={y} width="180" height="68" rx="14" fill={card} stroke={i === 0 ? colors.green : colors.border} strokeWidth="2" />
            <Rect x="36" y={y + 14} width="90" height="10" rx="5" fill={line} />
            <Rect x="36" y={y + 36} width="56" height="20" rx="10" fill={colors.accent} />
            <Rect x="100" y={y + 36} width="60" height="20" rx="10" fill="none" stroke={colors.border} strokeWidth="2" />
            {i === 0 && <Circle cx="182" cy={y + 18} r="8" fill={colors.green} />}
          </G>
        ))}
      </Svg>
    );
  }
  return (
    <Svg width={w} height={h} viewBox="0 0 220 170">
      <Path d="M 40 140 A 70 70 0 0 1 180 140" fill="none" stroke={line} strokeWidth="18" strokeLinecap="round" />
      <Path d="M 40 140 A 70 70 0 0 1 160.6 90.5" fill="none" stroke={colors.green} strokeWidth="18" strokeLinecap="round" />
      <Path d="M 92 122 L 104 134 L 128 110" fill="none" stroke={colors.text} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 12 },
  brand: { fontSize: 18, fontWeight: '700' },
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 24, gap: 18 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 23, textAlign: 'center' },
  input: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17 },
  bottom: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});
