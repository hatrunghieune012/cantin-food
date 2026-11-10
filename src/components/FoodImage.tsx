import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Icon from './Icon';

export default function FoodImage({ source, name, drink = false, style }: { source: ImageSourcePropType; name: string; drink?: boolean; style?: StyleProp<ViewStyle> }) {
  const [failed, setFailed] = useState(false);
  const uploadedImage = typeof source === 'object' && source !== null && 'uri' in source;
  useEffect(() => { setFailed(false); }, [source]);
  return <View style={[styles.frame, style]}>
    {failed ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8 }}><Icon name="menu" /><Text style={{ color: '#626D7B', fontSize: 11, textAlign: 'center' }}>Ảnh món ăn</Text></View>
      : <Image source={source} accessibilityLabel={name} style={styles.image} resizeMode={uploadedImage && !drink ? 'cover' : 'contain'} onError={() => setFailed(true)} />}
  </View>;
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#F2F3F5', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
