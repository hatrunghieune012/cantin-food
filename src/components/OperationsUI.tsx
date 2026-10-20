import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';

export function Action({ children, onPress, disabled = false }: { children: ReactNode; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[ui.button, disabled && { opacity: 0.45 }]}><Text style={ui.buttonText}>{children}</Text></Pressable>;
}
export function Field({ label, value, onChangeText, numeric = false }: { label: string; value: string; onChangeText: (s: string) => void; numeric?: boolean }) {
  return <View><Text style={ui.label}>{label}</Text><TextInput style={ui.input} value={value} onChangeText={onChangeText} keyboardType={numeric ? 'numeric' : 'default'} /></View>;
}
export const ui = StyleSheet.create({
  page: { padding: 18, gap: 14, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  card: { padding: 16, gap: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  title: { fontSize: 22, fontWeight: '800', color: '#20242A' },
  heading: { fontSize: 16, fontWeight: '700', color: '#20242A' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  button: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 9, backgroundColor: '#FFF0E9', alignSelf: 'flex-start' },
  buttonText: { color: '#C64A18', fontWeight: '700' },
  label: { color: '#606976', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D8DDE3', borderRadius: 9, padding: 12, marginBottom: 8, backgroundColor: '#FFFFFF' },
  error: { color: '#B42318', paddingVertical: 8 },
  muted: { color: '#687280' },
});
