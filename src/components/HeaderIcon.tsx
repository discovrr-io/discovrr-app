import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/core';

import { MainDrawerNavigationProp } from 'src/navigation';
import { IconProps } from 'react-native-vector-icons/Icon';
import { HeaderBackButtonProps } from '@react-navigation/elements';

// type HeaderIconProps = Pick<
//   TouchableOpacityProps,
//   'activeOpacity' | 'onPress' | 'style'
// > &
//   Pick<IconProps, 'name' | 'size'> & {
//     tintColor?: string;
//     pressColor?: string;
//     pressOpacity?: number;
//     labelVisible?: boolean;
//   };

type HeaderIconProps = HeaderBackButtonProps & Pick<IconProps, 'name' | 'size'>;

const HeaderIcon = (props: HeaderIconProps) => {
  const { name, size, disabled, pressOpacity, tintColor, style, ...restProps } =
    props;
  return (
    <TouchableOpacity
      activeOpacity={pressOpacity}
      disabled={disabled}
      {...restProps}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}>
      <Icon name={name} size={size ?? 32} color={tintColor} />
    </TouchableOpacity>
  );
};

type HeaderIconHelperProps = Omit<HeaderIconProps, 'name'>;

const HeaderIconMenu = (props: HeaderIconHelperProps) => {
  const navigation = useNavigation<MainDrawerNavigationProp>();
  return (
    <HeaderIcon
      name={'menu-outline'}
      onPress={() => navigation.openDrawer()}
      {...props}
    />
  );
};

const HeaderIconClose = (props: HeaderIconHelperProps) => {
  return <HeaderIcon name="close" {...props} />;
};

const HeaderIconBack = (props: HeaderIconHelperProps) => {
  const navigation = useNavigation();
  return (
    <HeaderIcon
      name="chevron-back"
      onPress={() => navigation.goBack()}
      {...props}
    />
  );
};

HeaderIcon.Menu = HeaderIconMenu;
HeaderIcon.Close = HeaderIconClose;
HeaderIcon.Back = HeaderIconBack;

export default HeaderIcon;
