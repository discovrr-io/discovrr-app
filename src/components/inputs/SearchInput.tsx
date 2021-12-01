import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import TextInput, { TextInputProps } from './TextInput';
import { color } from 'src/constants';

export type SearchInputProps = Omit<TextInputProps, 'suffix'> & {
  variant?: 'filled' | 'outlined';
};

export default function SearchInput(props: SearchInputProps) {
  const SearchIcon = <Icon name="search" size={24} color={color.black} />;
  return <TextInput suffix={SearchIcon} returnKeyType="search" {...props} />;
}
