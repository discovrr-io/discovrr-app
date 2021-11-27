import * as React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { color, font, layout } from 'src/constants';
import { useExtendedTheme } from 'src/hooks';
import Spacer from './Spacer';

export type BannerType = 'information' | 'hint' | 'warning' | 'error';

export type BannerProps = {
  title: string;
  caption: string;
  type?: BannerType;
  hideLeadingIcon?: string;
  containerStyles?: StyleProp<ViewStyle>;
  titleTextStyle?: StyleProp<TextStyle>;
  captionTextStyle?: StyleProp<TextStyle>;
};

export default function Banner(props: BannerProps) {
  const { dark, colors } = useExtendedTheme();

  const leadingIconName = React.useMemo(() => {
    switch (props.type) {
      case 'hint':
        return 'help-circle-outline';
      case 'warning':
        return 'alert-circle-outline';
      case 'error':
        return 'close-circle-outline';
      default:
        return 'information-circle-outline';
    }
  }, [props.type]);

  return (
    <View
      style={[
        bannerStyles.container,
        { backgroundColor: colors.border },
        props.type === 'hint' && {
          backgroundColor: dark ? color.blue700 : color.blue300,
          borderColor: dark ? color.blue300 : color.blue700,
        },
        props.type === 'warning' && {
          backgroundColor: dark ? color.orange700 : color.orange300,
          borderColor: dark ? color.orange300 : color.orange700,
        },
        props.type === 'error' && {
          backgroundColor: dark ? color.red700 : color.red300,
          borderColor: dark ? color.red300 : color.red700,
        },
        props.containerStyles,
      ]}>
      {!props.hideLeadingIcon && (
        <>
          <Icon name={leadingIconName} size={24} color={colors.text} />
          <Spacer.Horizontal value="sm" />
        </>
      )}
      <View style={[bannerStyles.textContainer]}>
        <Text
          style={[
            font.smallBold,
            { color: colors.text },
            props.titleTextStyle,
          ]}>
          {props.title}
        </Text>
        <Text
          style={[
            font.extraSmall,
            { color: colors.text },
            props.captionTextStyle,
          ]}>
          {props.caption}
        </Text>
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.md,
    borderColor: color.gray500,
    borderRadius: layout.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
});
