import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';
import LitDot from './LitDot';

export default function LitBadge({ color = 'green', children, style }) {
  const litColor = Colors.liturgicalUI[color] ?? Colors.liturgicalUI.white;
  return (
    <View style={[styles.badge, { backgroundColor: litColor + '18' }, style]}>
      <LitDot color={color} size={7} />
      <Text style={[styles.text, { color: litColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
