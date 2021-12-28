import * as React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import * as constants from 'src/constants';
import { ExtendedTheme, useExtendedTheme } from 'src/hooks';

type TextColor = keyof ExtendedTheme['colors'];
type TextFontSize = keyof typeof constants.font.size;
type TextFontWeight = keyof constants.font.FontFamily;

export type TextProps = RNTextProps & {
  color?: TextColor;
  size?: TextFontSize | number;
  weight?: TextFontWeight;
  underlined?: boolean;
};

/**
 * Alternative `Text` component that automatically changes colour depending on
 * the current color scheme, with predefined sizes and weights for consistency.
 */
export default function Text(props: TextProps) {
  const { colors } = useExtendedTheme();

  const fontSize = React.useMemo(() => {
    if (typeof props.size === 'number') return props.size;
    return constants.font.size[props.size ?? 'md'];
  }, [props.size]);

  const fontFamily = React.useMemo(() => {
    if (props.weight) {
      return constants.font.FONT_FAMILY[props.weight];
    } else {
      return constants.font.FONT_FAMILY.normal;
    }
  }, [props.weight]);

  return (
    <RNText
      {...props}
      style={[
        props.underlined && { textDecorationLine: 'underline' },
        { color: colors[props.color ?? 'text'], fontSize, fontFamily },
        props.style,
      ]}
    />
  );
}
