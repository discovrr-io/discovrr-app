import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/core';

import { color } from 'src/constants';
import { MainDrawerNavigationProp } from 'src/navigation';

type HeaderIconProps = Pick<
  TouchableOpacityProps,
  'activeOpacity' | 'onPress' | 'style'
> & {
  name: string;
  tintColor?: string;
  pressColor?: string;
  pressOpacity?: number;
  labelVisible?: boolean;
};

const HeaderIcon = (props: HeaderIconProps) => {
  const { name, tintColor, ...restProps } = props;
  return (
    <TouchableOpacity {...restProps}>
      <Icon name={name} size={32} color={tintColor ?? color.black} />
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
  return <HeaderIcon name="close-outline" {...props} />;
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
