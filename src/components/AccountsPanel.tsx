import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { request } from '../api';
import { Action, Field, ui } from './OperationsUI';

interface Account { id: number; full_name: string; student_code: string; email: string; phone: string; role: 'user' | 'staff' | 'admin'; is_active: number | boolean }
export default function AccountsPanel({ token }: { token: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Account | null>(null);
  const [access, setAccess] = useState<Account | null>(null);
  async function load() {
    try { const data = await request('/api/admin/users', token); setAccounts(data.users); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải tài khoản.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [token]);
  async function detail(id: number) {
    setBusy(true); setError('');
    try { const data = await request(`/api/admin/users/${id}`, token); setSelected(data.user); setAccess(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải chi tiết.'); }
    finally { setBusy(false); }
  }
  async function save(changeAccess = false) {
    const account = changeAccess ? access : selected;
    if (!account) return;
    setBusy(true); setError('');
    try {
      await request(`/api/admin/users/${account.id}${changeAccess ? '/access' : ''}`, token, {
        method: 'PUT', body: JSON.stringify(changeAccess ? { role: account.role, is_active: Boolean(account.is_active) } : account),
      });
      setSelected(null); setAccess(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể lưu tài khoản.'); }
    finally { setBusy(false); }
  }
  const visible = accounts.filter(a => (role === 'all' || a.role === role) && `${a.full_name} ${a.student_code} ${a.email}`.toLowerCase().includes(search.toLowerCase().trim()));
  return <View style={{ gap: 12 }}>
    <Text style={ui.title}>Quản lý tài khoản</Text>
    <Action onPress={load}>Làm mới</Action>
    <Field label="Tìm theo tên, email, mã sinh viên" value={search} onChangeText={setSearch} />
    <View style={ui.row}>{[['all', 'Tất cả'], ['user', 'Sinh viên'], ['staff', 'Nhân viên'], ['admin', 'Quản trị viên']].map(([value, label]) => <Action key={value} onPress={() => setRole(value)}>{role === value ? '✓ ' : ''}{label}</Action>)}</View>
    {loading && <Text>Đang tải tài khoản…</Text>}
    {error !== '' && <Text style={ui.error}>{error}</Text>}
    {selected && <View style={ui.card}>
      <Text style={ui.heading}>Chi tiết #{selected.id}</Text>
      {(['full_name', 'student_code', 'email', 'phone'] as const).map((field, i) => <Field key={field} label={['Họ tên', 'Mã sinh viên / nhân viên', 'Email', 'Số điện thoại'][i]} value={selected[field] || ''} onChangeText={value => setSelected({ ...selected, [field]: value })} />)}
      <Text>Vai trò: {selected.role} · {selected.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}</Text>
      <View style={ui.row}>{selected.role !== 'admin' && <Action disabled={busy} onPress={() => save()}>Lưu thông tin</Action>}<Action disabled={busy} onPress={() => setSelected(null)}>Đóng</Action></View>
    </View>}
    {access && <View style={ui.card}>
      <Text style={ui.heading}>Quyền truy cập: {access.full_name}</Text>
      <Text>Thay đổi quyền hoặc trạng thái sẽ kết thúc các phiên đăng nhập cũ.</Text>
      <View style={ui.row}>{(['user', 'staff'] as const).map(value => <Action key={value} onPress={() => setAccess({ ...access, role: value })}>{access.role === value ? '✓ ' : ''}{value === 'user' ? 'Sinh viên' : 'Nhân viên'}</Action>)}</View>
      <Action onPress={() => setAccess({ ...access, is_active: !access.is_active })}>{access.is_active ? 'Đang hoạt động' : 'Vô hiệu hóa'} — nhấn để đổi</Action>
      <View style={ui.row}><Action disabled={busy} onPress={() => save(true)}>Xác nhận lưu quyền</Action><Action disabled={busy} onPress={() => setAccess(null)}>Hủy</Action></View>
    </View>}
    {!loading && !error && visible.length === 0 && <Text>Không tìm thấy tài khoản.</Text>}
    {visible.map(account => <View style={ui.card} key={account.id}>
      <Text style={ui.heading}>{account.full_name} · {account.student_code}</Text>
      <Text>{account.email} · {account.phone || 'Chưa có SĐT'}</Text>
      <Text>{account.role} · {account.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}</Text>
      <View style={ui.row}><Action disabled={busy} onPress={() => detail(account.id)}>Chi tiết / sửa</Action>{account.role !== 'admin' && <Action disabled={busy} onPress={() => { setAccess(account); setSelected(null); }}>Phân quyền / vô hiệu hóa</Action>}</View>
    </View>)}
  </View>;
}
