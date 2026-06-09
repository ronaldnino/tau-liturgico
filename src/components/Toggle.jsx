import React from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

export default function Toggle({ on, onChange }) {
  return (
    <TouchableOpacity
      onPress={onChange}
      activeOpacity={0.8}
      style={[styles.track, { backgroundColor: on ? Colors.brand.primary : '#CBD5E1' }]}
    >
      <Animated.View
        style={[styles.thumb, { transform: [{ translateX: on ? 18 : 0 }] }]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});
