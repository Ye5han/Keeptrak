import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useColors } from '@/lib/theme';

type Props = { ratio: number; size?: number; label?: string; color?: string; centerText?: string };

/** A half-circle gauge that fills from left to right as steps get done. */
export function Gauge({ ratio, size = 160, label, color: colorOverride, centerText }: Props) {
  const colors = useColors();
  const clamped = Math.max(0, Math.min(1, ratio));
  const stroke = Math.max(8, size * 0.09);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const height = size / 2 + stroke / 2;

  const point = (t: number) => {
    const angle = Math.PI * (1 - t);
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };
  const start = point(0);
  const end = point(1);
  const fillEnd = point(clamped);
  const track = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  const fill = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${fillEnd.x} ${fillEnd.y}`;
  const percent = Math.round(clamped * 100);
  const color = colorOverride ?? (clamped >= 1 ? colors.done : colors.accent);

  return (
    <View
      style={{ width: size, alignItems: 'center' }}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      accessibilityLabel={label ?? 'Progress'}>
      <Svg width={size} height={height}>
        <Path d={track} stroke={colors.track} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        {clamped > 0 && (
          <Path d={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        )}
      </Svg>
      <View style={[styles.center, { top: height - size * 0.28 }]}>
        <Text style={{ color: colors.text, fontSize: size * 0.2, fontWeight: '700' }}>{centerText ?? `${percent}%`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
