import React from 'react';
import { View, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

export default function Card({ children, style, accent }) {
  return (
    <View
      style={[
        styles.card,
        accent && {
          borderLeftWidth: 4,
          borderLeftColor: Colors.liturgical[accent] ?? Colors.brand.primary,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.primary,
    borderWidth: 0.5,
    borderColor: Colors.border.default,
    borderRadius: 14,
    padding: 16,
  },
});
