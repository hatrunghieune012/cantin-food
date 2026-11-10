import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import type { MonAn, MonTrongGioHang } from '../types';
import FoodCard from './FoodCard';
import Interactive from './Interactive';
import Icon from './Icon';
import { colors, focusRing } from '../styles/theme';

const QUICK_FILTERS = ['Tất cả', 'Cơm', 'Bún', 'Phở', 'Mì', 'Ăn vặt', 'Đồ uống'] as const;
type QuickFilter = (typeof QUICK_FILTERS)[number];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLocaleLowerCase('vi');
}

function matchesQuickFilter(food: MonAn, filter: QuickFilter) {
  if (filter === 'Tất cả') return true;
  const keyword = normalize(filter);
  return normalize(food.danhMuc) === keyword || normalize(food.ten).includes(keyword);
}

export interface CatalogState { loading: boolean; error: string; onRetry: () => void }
interface Props extends CatalogState {
  foods: MonAn[]; cart: MonTrongGioHang[]; onSelect: (food: MonAn) => void; onAdd: (food: MonAn) => void;
  title: string; onSeeAll?: () => void;
}
export default function FoodCatalog({ foods, cart, onSelect, onAdd, title, onSeeAll, loading, error, onRetry }: Props) {
  const { width } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(Math.max(0, Math.min(width, 1280) - (width >= 768 ? 64 : 32)));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<QuickFilter>('Tất cả');
  const [focused, setFocused] = useState(false);
  const matches = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    return foods.filter(food => matchesQuickFilter(food, category)
      && (!normalizedQuery || normalize(`${food.ten} ${food.moTa} ${food.danhMuc}`).includes(normalizedQuery)));
  }, [foods, category, query]);
  const columns = width >= 1200 ? 4 : width >= 768 ? (gridWidth >= 900 ? 3 : 2) : gridWidth >= 520 ? 2 : 1;
  const cardWidth = Math.max(0, Math.floor((gridWidth - (columns - 1) * 16) / columns));
  return <View style={{ gap: 24 }}>
    <View style={[styles.search, focused && focusRing]}>
      <Icon name="search" color={colors.primary} />
      <TextInput accessibilityLabel="Tìm món ăn theo tên" placeholder="Hôm nay bạn muốn ăn gì?" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={styles.input} />
      {query !== '' && <Interactive accessibilityLabel="Xóa từ khóa" onPress={() => setQuery('')} style={styles.clear}><Icon name="close" /></Interactive>}
    </View>
    <View accessibilityLabel="Tìm kiếm nhanh" style={styles.filters}>{QUICK_FILTERS.map(item => <Interactive key={item} accessibilityState={{ selected: category === item }}
      onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.selected]}>
      <Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text>
    </Interactive>)}</View>
    <View style={styles.headingRow}><View style={{ flex: 1 }}><Text style={styles.heading}>{title}</Text>
      {!loading && !error && <Text style={styles.meta}>{matches.length} món phù hợp</Text>}</View>
      {onSeeAll && <Interactive onPress={onSeeAll} style={styles.clear}><Text style={styles.link}>Xem tất cả →</Text></Interactive>}
    </View>
    {loading && <View style={styles.loading} accessibilityLiveRegion="polite"><ActivityIndicator color={colors.primary} /><Text style={styles.meta}>Đang tải thực đơn…</Text></View>}
    {error !== '' && <View style={styles.empty} accessibilityRole="alert"><Text style={styles.heading}>Chưa tải được thực đơn</Text><Text style={styles.meta}>{error}</Text><Interactive onPress={onRetry} style={styles.chip}><Text style={styles.link}>Thử lại</Text></Interactive></View>}
    <View style={styles.grid} onLayout={event => setGridWidth(event.nativeEvent.layout.width)}>
      {loading && foods.length === 0 ? Array.from({ length: columns * 2 }, (_, i) => <View key={i} accessible={false} style={[styles.skeleton, { width: Math.max(0, cardWidth) }]} />)
        : matches.map(food => <FoodCard key={food.ma} monAn={food} cardWidth={cardWidth} khiNhan={() => onSelect(food)} khiThemVaoGio={() => onAdd(food)} soLuongTrongGio={cart.find(item => item.ma === food.ma)?.soLuong || 0} />)}
    </View>
    {!loading && !error && matches.length === 0 && <View style={styles.empty}>
      <Icon name="search" /><Text style={styles.heading}>{foods.length ? 'Chưa tìm thấy món phù hợp' : 'Thực đơn chưa có món ăn'}</Text>
      <Text style={styles.meta}>{foods.length ? 'Thử từ khóa khác hoặc xem tất cả danh mục.' : 'Vui lòng quay lại sau hoặc tải lại thực đơn.'}</Text>
      <Interactive style={styles.chip} onPress={() => { setQuery(''); setCategory('Tất cả'); if (!foods.length) onRetry(); }}><Text style={styles.link}>{foods.length ? 'Xóa bộ lọc' : 'Tải lại'}</Text></Interactive>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  search: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 52, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, minWidth: 0, minHeight: 50, paddingHorizontal: 0, borderWidth: 0, fontSize: 15, color: colors.text, backgroundColor: 'transparent', outlineStyle: 'none' } as any,
  clear: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 10 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: colors.soft, backgroundColor: colors.soft },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: colors.primaryDark, fontWeight: '800' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading: { color: colors.text, fontWeight: '800', fontSize: 21 },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  link: { color: colors.primary, fontWeight: '700' },
  loading: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  skeleton: { height: 360, borderRadius: 16, backgroundColor: '#E7EAEF' },
  empty: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 24, alignItems: 'center', gap: 12 },
});
