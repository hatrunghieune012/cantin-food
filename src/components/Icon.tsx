import { View, type ViewStyle } from 'react-native';

export type IconName = 'home' | 'menu' | 'cart' | 'search' | 'user' | 'close';
export default function Icon({ name, color = '#626D7B' }: { name: IconName; color?: string }) {
  const line = (style: ViewStyle, key: string) => <View key={key} style={[{ position: 'absolute', borderColor: color, borderWidth: 1.7 }, style]} />;
  return <View accessible={false} style={{ width: 24, height: 24 }}>
    {name === 'home' && <>{line({ width: 13, height: 13, left: 5, top: 3, transform: [{ rotate: '45deg' }], borderRightWidth: 0, borderBottomWidth: 0 }, 'roof')}{line({ left: 5, top: 10, width: 14, height: 12, borderTopWidth: 0, borderRadius: 2 }, 'body')}{line({ left: 10, top: 14, width: 4, height: 8 }, 'door')}</>}
    {name === 'menu' && [4, 10, 16].map(top => line({ top, left: 3, width: 18, height: 3, borderRadius: 2 }, String(top)))}
    {name === 'cart' && <>{line({ left: 5, top: 5, width: 16, height: 11, borderRadius: 2 }, 'body')}{line({ left: 1, top: 2, width: 5, height: 4, borderRightWidth: 0, borderBottomWidth: 0 }, 'handle')}{[7, 17].map(left => line({ left, top: 19, width: 4, height: 4, borderRadius: 3 }, String(left)))}</>}
    {name === 'search' && <>{line({ left: 3, top: 3, width: 13, height: 13, borderRadius: 8 }, 'ring')}{line({ left: 15, top: 17, width: 8, height: 0, transform: [{ rotate: '45deg' }] }, 'handle')}</>}
    {name === 'user' && <>{line({ left: 8, top: 2, width: 8, height: 8, borderRadius: 5 }, 'head')}{line({ left: 4, top: 13, width: 16, height: 9, borderTopLeftRadius: 9, borderTopRightRadius: 9 }, 'body')}</>}
    {name === 'close' && [-45, 45].map(deg => line({ left: 3, top: 11, width: 18, height: 0, transform: [{ rotate: `${deg}deg` }] }, String(deg)))}
  </View>;
}
