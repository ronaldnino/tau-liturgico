import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../theme/colors';
import { TextStyles } from '../theme/typography';

export default function SectionTitle({ children, action, dark, onActionPress }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.title, dark && styles.titleDark]}>{children}</Text>
      {action && (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  title: {
    ...TextStyles.eyebrow,
    color: Colors.ink.muted,
  },
  titleDark: {
    color: 'rgba(255,255,255,0.55)',
  },
  action: {
    ...TextStyles.meta,
    fontSize: 13,
    color: Colors.brand.primary,
  },
});
