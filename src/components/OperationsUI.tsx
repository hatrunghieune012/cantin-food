import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Interactive from './Interactive';
import { colors, focusRing } from '../styles/theme';
import type { ReactNode } from 'react';

export function Action({ children, onPress, disabled = false }: { children: ReactNode; onPress: () => void; disabled?: boolean }) {
  return <Interactive disabled={disabled} onPress={onPress} style={ui.button}><Text style={ui.buttonText}>{children}</Text></Interactive>;
}
export function Field({ label, value, onChangeText, numeric = false }: { label: string; value: string; onChangeText: (s: string) => void; numeric?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <View><Text style={ui.label}>{label}</Text><TextInput accessibilityLabel={label} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[ui.input, focused && focusRing]} value={value} onChangeText={onChangeText} keyboardType={numeric ? 'numeric' : 'default'} /></View>;
}
export const ui = StyleSheet.create({
  page: { padding: 18, gap: 14, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  card: { padding: 16, gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  heading: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.soft, alignSelf: 'flex-start' },
  buttonText: { color: colors.primaryDark, fontWeight: '700' },
  label: { color: '#606976', marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 8, backgroundColor: '#FFFFFF', color: colors.text },
  error: { color: colors.red, paddingVertical: 8 },
  muted: { color: '#687280' },
});
