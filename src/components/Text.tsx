import * as React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';

type TextFontSize = keyof typeof constants.font.size;

type TextFontWeight = '500' | '700' | '900';

export type TextProps = RNTextProps & {
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
    switch (props.weight) {
      case '900':
        return constants.font.FONT_FAMILY_BOLD;
      case '700':
        return constants.font.FONT_FAMILY_MEDIUM;
      case '500': /* FALLTHROUGH */
      default:
        return constants.font.FONT_FAMILY_REGULAR;
    }
  }, [props.weight]);

  return (
    <RNText
      {...props}
      style={[
        props.underlined && { textDecorationLine: 'underline' },
        { color: colors.text, fontSize, fontFamily },
        props.style,
      ]}
    />
  );
}
