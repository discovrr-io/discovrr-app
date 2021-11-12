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
  const textColorStyles = React.useMemo<TextStyle>(() => {
    switch (props.type ?? 'information') {
      case 'information':
        return { color: color.defaultDarkTextColor };
      default:
        return { color: color.defaultLightTextColor };
    }
  }, [props.type]);

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
        props.type === 'hint' && {
          backgroundColor: color.blue300,
          borderColor: color.blue700,
        },
        props.type === 'warning' && {
          backgroundColor: color.orange300,
          borderColor: color.orange700,
        },
        props.type === 'error' && {
          backgroundColor: color.red300,
          borderColor: color.red700,
        },
        props.containerStyles,
      ]}>
      {!props.hideLeadingIcon && (
        <>
          <Icon
            name={leadingIconName}
            size={24}
            color={textColorStyles.color}
          />
          <Spacer.Horizontal value="sm" />
        </>
      )}
      <View style={[bannerStyles.textContainer]}>
        <Text style={[font.smallBold, textColorStyles, props.titleTextStyle]}>
          {props.title}
        </Text>
        <Text
          style={[font.extraSmall, textColorStyles, props.captionTextStyle]}>
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
    backgroundColor: color.gray100,
    borderColor: color.gray500,
    borderRadius: layout.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
});
