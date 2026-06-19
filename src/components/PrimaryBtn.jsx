import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';
import { TextStyles } from '../theme/typography';

export default function PrimaryBtn({ children, onPress, disabled, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.btn, disabled && styles.disabled, style]}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#CBD5E1',
  },
  text: {
    ...TextStyles.button,
    color: '#fff',
  },
});
