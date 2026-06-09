import React from 'react';
import Svg, { Text as SvgText, Line } from 'react-native-svg';
import Colors from '../theme/colors';

export default function TauWordmark({
  width = 280,
  color = Colors.brand.primary,
  accentColor,
  style,
}) {
  const accent = accentColor || color;
  return (
    <Svg
      viewBox="0 0 680 240"
      width={width}
      height={width * (240 / 680)}
      preserveAspectRatio="xMidYMid meet"
      style={style}
    >
      <SvgText
        x="60" y="150"
        fontFamily="CormorantGaramond-SemiBoldItalic"
        fontSize={190}
        fill={color}
      >
        {'τau'}
      </SvgText>
      <SvgText
        x="200" y="195"
        fontFamily="CormorantGaramond-Medium"
        fontSize={36}
        letterSpacing={4.5}
        fill={accent}
      >
        {'LITÚRGICO'}
      </SvgText>
      <Line
        x1="200" y1="208" x2="618" y2="208"
        stroke={accent} strokeWidth={0.5} strokeOpacity={0.4}
      />
    </Svg>
  );
}
