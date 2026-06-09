import React from 'react';
import { View } from 'react-native';
import Colors from '../theme/colors';

export default function LitDot({ color = 'green', size = 8, style }) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.liturgical[color] ?? Colors.liturgical.white,
          flexShrink: 0,
        },
        style,
      ]}
    />
  );
}
