import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Interactive from './Interactive';
import { colors } from '../styles/theme';
import { todayVietnam, validBirthDate } from '../accountValidation';
import type { NguoiDung } from '../types';

export const genderLabels = { male: 'Nam', female: 'Nữ', other: 'Khác' };
export function displayBirthDate(value?: string | null) {
  return value ? value.split('-').reverse().join('/') : 'Chưa cập nhật';
}

// Shared calendar uses only React Native primitives, including on Expo Web.
export default function DemographicFields({ gender, dateOfBirth, onGender, onDate, disabled = false }: {
  gender: NguoiDung['gender']; dateOfBirth: string;
  onGender: (value: NonNullable<NguoiDung['gender']>) => void;
  onDate: (value: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const today = todayVietnam();
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [yearText, setYearText] = useState(today.slice(0, 4));
  const year = Number(yearText);
  const validYear = /^[1-9]\d{3}$/.test(yearText) && year <= Number(today.slice(0, 4));
  const days = validYear ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;
  const offset = validYear ? (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7 : 0;
  function showCalendar() {
    const initial = validBirthDate(dateOfBirth) ? dateOfBirth : today;
    setYearText(initial.slice(0, 4)); setMonth(Number(initial.slice(5, 7))); setOpen(true);
  }
  function moveMonth(delta: number) {
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYearText(String(date.getUTCFullYear())); setMonth(date.getUTCMonth() + 1);
  }
  return <View style={styles.fields}>
    <Text style={styles.label}>Giới tính</Text>
    <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel="Giới tính">
      {(Object.keys(genderLabels) as Array<keyof typeof genderLabels>).map(value => <Interactive key={value}
        accessibilityRole="radio" accessibilityState={{ checked: gender === value, disabled }} disabled={disabled}
        onPress={() => onGender(value)} style={[styles.choice, gender === value && styles.selected]}>
        <Text style={{ color: gender === value ? colors.primaryDark : colors.text }}>{genderLabels[value]}</Text>
      </Interactive>)}
    </View>
    <Text style={styles.label}>Ngày sinh</Text>
    <Interactive disabled={disabled} onPress={showCalendar} accessibilityLabel="Chọn ngày sinh" style={styles.dateInput}>
      <Text style={{ color: dateOfBirth ? colors.text : colors.muted }}>{dateOfBirth ? displayBirthDate(dateOfBirth) : 'Chọn ngày / tháng / năm'}</Text>
      <Text style={{ color: colors.primary }}>▦</Text>
    </Interactive>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.backdrop}>
        <View style={styles.calendar} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.title}>Chọn ngày sinh</Text>
            <Text style={styles.hint}>Nhập năm, chọn tháng rồi chọn ngày.</Text>
            <View style={styles.monthRow}>
              <Interactive accessibilityLabel="Tháng trước" disabled={!validYear || (year === 1000 && month === 1)} style={styles.arrow} onPress={() => moveMonth(-1)}><Text>‹</Text></Interactive>
              <Text style={styles.label}>Tháng {month}</Text>
              <TextInput accessibilityLabel="Năm sinh" style={styles.year} value={yearText} onChangeText={setYearText} keyboardType="number-pad" maxLength={4} selectTextOnFocus />
              <Interactive accessibilityLabel="Tháng sau" disabled={!validYear || `${yearText}-${String(month).padStart(2, '0')}` >= today.slice(0, 7)} style={styles.arrow} onPress={() => moveMonth(1)}><Text>›</Text></Interactive>
            </View>
            {!validYear && <Text accessibilityRole="alert" style={{ color: colors.red }}>Nhập năm từ 1000 đến {today.slice(0, 4)}.</Text>}
            <View style={styles.days}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(label => <View key={label} style={styles.day}><Text style={styles.hint}>{label}</Text></View>)}
              {Array.from({ length: offset }, (_, i) => <View key={`empty-${i}`} style={styles.day} />)}
              {Array.from({ length: days }, (_, i) => {
                const value = `${yearText}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                return <Interactive key={value} accessibilityLabel={displayBirthDate(value)} accessibilityState={{ selected: dateOfBirth === value }}
                  disabled={value > today} style={[styles.day, dateOfBirth === value && styles.selected]}
                  onPress={() => { onDate(value); setOpen(false); }}><Text style={{ color: colors.text }}>{i + 1}</Text></Interactive>;
              })}
            </View>
            <Interactive style={styles.close} onPress={() => setOpen(false)}><Text style={{ color: colors.primaryDark }}>Đóng</Text></Interactive>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  fields: { gap: 8, marginBottom: 16 }, label: { color: colors.text, fontWeight: '700' },
  choices: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  choice: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  selected: { backgroundColor: colors.soft, borderColor: colors.primary },
  dateInput: { minHeight: 52, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 8, backgroundColor: colors.surface },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', padding: 12, alignItems: 'center', justifyContent: 'center' },
  calendar: { width: '100%', maxWidth: 400, maxHeight: '90%', padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  title: { fontSize: 20, fontWeight: '800', color: colors.text }, hint: { color: colors.muted, lineHeight: 20 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  arrow: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.soft },
  year: { width: 72, minHeight: 48, textAlign: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, color: colors.text },
  days: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: '14.285714%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  close: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.soft },
});
