import Svg, { Path, Rect } from 'react-native-svg';

import type { Colors } from '@/lib/theme';

/** The Keeptrak mark: a half gauge, mostly filled, with a tick. */
export function Logo({ colors, size }: { colors: Colors; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx="24" fill={colors.accent} />
      <Path d="M 22 66 A 28 28 0 0 1 78 66" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="9" strokeLinecap="round" />
      <Path d="M 22 66 A 28 28 0 0 1 72.2 50.3" fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
      <Path d="M 41 61 L 47.5 67.5 L 60 55" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
