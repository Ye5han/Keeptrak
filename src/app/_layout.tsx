import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GoalsProvider } from '@/lib/goals-store';
import { useColors } from '@/lib/theme';

export default function RootLayout() {
  const colors = useColors();
  return (
    <GoalsProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'Keeptrak' }} />
        <Stack.Screen name="new-goal" options={{ title: 'New goal', presentation: 'modal' }} />
        <Stack.Screen name="goal/[id]/index" options={{ title: '' }} />
        <Stack.Screen name="goal/[id]/plan" options={{ title: 'Step plan' }} />
      </Stack>
    </GoalsProvider>
  );
}
