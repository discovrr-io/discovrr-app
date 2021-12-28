import React from 'react';
import { TouchableOpacity } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/core';

import { MainDrawerNavigationProp } from 'src/navigation';
import { IconProps } from 'react-native-vector-icons/Icon';
import { HeaderBackButtonProps } from '@react-navigation/elements';

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

type HeaderIconHelperProps = Omit<HeaderIconProps, 'name'> & {
  name?: string;
};

const HeaderIconMenu = (props: HeaderIconHelperProps) => {
  const { name, ...restProps } = props;
  const navigation = useNavigation<MainDrawerNavigationProp>();
  return (
    <HeaderIcon
      name={name || 'menu-outline'}
      onPress={() => navigation.openDrawer()}
      {...restProps}
    />
  );
};

const HeaderIconClose = (props: HeaderIconHelperProps) => {
  const { name, ...restProps } = props;
  return <HeaderIcon name={name || 'close'} {...restProps} />;
};

const HeaderIconBack = (props: HeaderIconHelperProps) => {
  const { name, ...restProps } = props;
  const navigation = useNavigation();
  return (
    <HeaderIcon
      name={name || 'chevron-back'}
      onPress={() => navigation.goBack()}
      {...restProps}
    />
  );
};

HeaderIcon.Menu = HeaderIconMenu;
HeaderIcon.Close = HeaderIconClose;
HeaderIcon.Back = HeaderIconBack;

export default HeaderIcon;
