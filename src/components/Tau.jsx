import React from 'react';
import Svg, { Text as SvgText } from 'react-native-svg';
import Colors from '../theme/colors';

export default function Tau({ size = 32, color = Colors.brand.primary, style }) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <SvgText
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="CormorantGaramond-SemiBoldItalic"
        fontSize={92}
        fill={color}
      >
        {'τ'}
      </SvgText>
    </Svg>
  );
}
