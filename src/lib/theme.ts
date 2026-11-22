import { useColorScheme } from 'react-native';

const light = {
  background: '#F6F7F9',
  card: '#FFFFFF',
  text: '#14171F',
  muted: '#5E6675',
  border: '#E1E4EA',
  accent: '#2F6FEB',
  track: '#E4E8F0',
  done: '#1E9E62',
  danger: '#C8372D',
};

const dark: typeof light = {
  background: '#0F1115',
  card: '#191C22',
  text: '#EEF0F4',
  muted: '#9AA2B1',
  border: '#2A2E37',
  accent: '#5B8DF5',
  track: '#2A2E37',
  done: '#3CC383',
  danger: '#F06A5F',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
