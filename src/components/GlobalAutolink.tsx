import * as React from 'react';

import Autolink, { AutolinkProps } from 'react-native-autolink';
import { useNavigation } from '@react-navigation/core';

import * as constants from 'src/constants';
import { RootStackNavigationProp } from 'src/navigation';
import { useExtendedTheme } from 'src/hooks';

type GlobalAutolinkProps = AutolinkProps & {
  /**
   * Whether the styles of the link inherits the style applied to the
   * surrounding text. Defaults to `true`.
   *
   * @default true
   */
  linkInheritsTextStyle?: boolean;

  /**
   * This is present in the underlying `Autolink` component, but TypeScript
   * fails to recognise this.
   */
  numberOfLines?: number;
};

export default function GlobalAutolink(props: GlobalAutolinkProps) {
  const {
    textProps,
    linkStyle,
    matchers = [],
    linkInheritsTextStyle = true,
    ...restProps
  } = props;

  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useExtendedTheme();

  return (
    <Autolink
      {...restProps}
      textProps={{
        ...textProps,
        style: [{ color: colors.text }, textProps?.style],
      }}
      linkStyle={[
        { color: colors.primary },
        linkInheritsTextStyle && textProps?.style,
        linkStyle,
      ]}
      matchers={[
        {
          ...constants.regex.USERNAME_MENTION_MATCHER,
          onPress: match => {
            navigation.push('ProfileDetails', {
              profileIdOrUsername: match.getMatchedText(),
            });
          },
        },
        ...matchers,
      ]}
    />
  );
}
