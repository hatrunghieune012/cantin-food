import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { localTime, request } from '../api';
import { Action, Field, ui } from '../components/OperationsUI';

interface Table { id: number; code: string; area: string; seats: number; status: 'available' | 'occupied' | 'unknown'; is_active: number | boolean; updated_at: string }
const labels = { available: 'Còn trống', occupied: 'Đang có người', unknown: 'Chưa xác định' };
const blank = { code: '', area: '', seats: '4', status: 'unknown' as Table['status'], is_active: true };

export default function TablesScreen({ token, management = false }: { token: string; management?: boolean }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState(blank);
  const [updated, setUpdated] = useState('');
  async function load() {
    try { const data = await request('/api/tables', token); setTables(data.tables); setError(''); setUpdated(new Date().toISOString()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải bàn.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [token]);
  async function save() {
    setSaving(true); setError('');
    try {
      await request(editing === 'new' ? '/api/tables' : `/api/tables/${editing}`, token, {
        method: editing === 'new' ? 'POST' : 'PUT',
        body: JSON.stringify({ ...form, seats: Number(form.seats) }),
      });
      setEditing(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể lưu bàn.'); }
    finally { setSaving(false); }
  }
  return <ScrollView contentContainerStyle={ui.page}>
    <Text style={ui.title}>Chỗ ngồi</Text>
    <Text style={ui.muted}>Trạng thái do nhân viên cập nhật, có thể thay đổi khi bạn đến. Không đặt hoặc giữ bàn.</Text>
    <View style={ui.row}><Action onPress={load}>Làm mới</Action>{management && <Action onPress={() => { setEditing('new'); setForm(blank); }}>Thêm bàn</Action>}</View>
    {updated !== '' && <Text style={ui.muted}>Lần tải gần nhất: {localTime(updated)} · Tự tải lại mỗi 30 giây</Text>}
    {loading && <Text>Đang tải bàn…</Text>}
    {error !== '' && <Text style={ui.error}>{error}</Text>}
    {editing !== null && <View style={ui.card}>
      <Text style={ui.heading}>{editing === 'new' ? 'Thêm bàn' : 'Chỉnh sửa bàn'}</Text>
      <Field label="Mã bàn" value={form.code} onChangeText={code => setForm({ ...form, code })} />
      <Field label="Khu vực" value={form.area} onChangeText={area => setForm({ ...form, area })} />
      <Field label="Số ghế" value={form.seats} numeric onChangeText={seats => setForm({ ...form, seats })} />
      <View style={ui.row}>{(Object.keys(labels) as Table['status'][]).map(status => <Action key={status} onPress={() => setForm({ ...form, status })}>{form.status === status ? '✓ ' : ''}{labels[status]}</Action>)}</View>
      <Action onPress={() => setForm({ ...form, is_active: !form.is_active })}>{form.is_active ? 'Đang sử dụng' : 'Ngừng sử dụng'} — nhấn để đổi</Action>
      <View style={ui.row}><Action disabled={saving} onPress={save}>{saving ? 'Đang lưu…' : 'Lưu bàn'}</Action><Action disabled={saving} onPress={() => setEditing(null)}>Hủy</Action></View>
    </View>}
    {!loading && !error && tables.length === 0 && <Text>Chưa có thông tin bàn.</Text>}
    {tables.map(table => <View style={ui.card} key={table.id}>
      <Text style={ui.heading}>{table.code} · {table.area} · {table.seats} ghế</Text>
      <Text>{table.is_active ? labels[table.status] : 'Ngừng sử dụng'}</Text>
      <Text style={ui.muted}>Cập nhật: {localTime(table.updated_at)}</Text>
      {management && <Action disabled={saving} onPress={() => { setEditing(table.id); setForm({ ...table, seats: String(table.seats), is_active: Boolean(table.is_active) }); }}>Sửa / cập nhật trạng thái</Action>}
    </View>)}
  </ScrollView>;
}
