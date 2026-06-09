import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

export default function GhostBtn({ children, onPress, light, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { borderColor: light ? 'rgba(255,255,255,0.5)' : Colors.brand.primary },
        style,
      ]}
    >
      <Text style={[styles.text, { color: light ? '#fff' : Colors.brand.primary }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
});
