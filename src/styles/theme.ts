import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  primary: '#EA580C', primaryDark: '#C2410C', soft: '#FFF7ED',
  background: '#F8FAFC', surface: '#FFFFFF', text: '#1F2937', muted: '#626D7B',
  border: '#E2E8F0', green: '#16A34A', greenSoft: '#EAF7EF', red: '#DC2626', redSoft: '#FFF0F2',
};
export const pageLayout: ViewStyle = { width: '100%', maxWidth: 1280, alignSelf: 'center', padding: 16, paddingBottom: 40 };
export const cardShadow: ViewStyle = { shadowColor: '#1F2937', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 };
export const webTransition: ViewStyle = Platform.OS === 'web' ? {
  transitionProperty: 'background-color, border-color, box-shadow, transform', transitionDuration: '140ms',
} as ViewStyle : {};
export const focusRing: ViewStyle = Platform.OS === 'web' ? {
  outlineStyle: 'solid', outlineWidth: 3, outlineOffset: 3, outlineColor: '#E88859',
} as ViewStyle : { borderColor: colors.primary };
