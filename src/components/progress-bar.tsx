import { View } from 'react-native';

import { useColors } from '@/lib/theme';

export function ProgressBar({ ratio }: { ratio: number }) {
  const colors = useColors();
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' }}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: clamped >= 1 ? colors.done : colors.accent,
        }}
      />
    </View>
  );
}
