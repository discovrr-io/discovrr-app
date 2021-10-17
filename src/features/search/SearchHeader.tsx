import React, { useRef, useState } from 'react';
import { TextInput as RNTextInput, SafeAreaView, View } from 'react-native';

import { getDefaultHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { StackHeaderProps } from '@react-navigation/stack';

import { HeaderIcon, TextInput } from 'src/components';
import { color, layout } from 'src/constants';
import { SearchStackNavigationProp } from 'src/navigation';

const HEADER_HORIZONTAL_PADDING = layout.defaultScreenMargins.horizontal;
const HEADER_TEXT_INPUT_ICON_SIZE = 24;

function SearchHeaderContent() {
  const navigation = useNavigation<SearchStackNavigationProp>();

  const textInputRef = useRef<RNTextInput>(null);
  const [searchText, setSearchText] = useState('');

  const handleClearQuery = () => {
    setSearchText('');
    navigation.navigate('Query');
    textInputRef.current?.focus();
  };

  const handleSearchQuery = () => {
    const query = searchText.trim();
    if (query.length > 0) {
      console.log(`Searching '${query}'...`);
      navigation.navigate('Results', { query });
    }
  };

  return (
    <TextInput
      ref={textInputRef}
      size="medium"
      placeholder="Search for anything..."
      value={searchText}
      onChangeText={setSearchText}
      onSubmitEditing={handleSearchQuery}
      returnKeyType="search"
      autoCompleteType="off"
      autoCorrect={false}
      suffix={
        searchText.length > 0 ? (
          <TextInput.Icon
            name="close-circle"
            size={HEADER_TEXT_INPUT_ICON_SIZE}
            color={color.black}
            onPress={handleClearQuery}
          />
        ) : undefined
      }
      containerStyle={{
        flexGrow: 1,
        flexShrink: 1,
      }}
    />
  );
}

export default function SearchHeader(props: StackHeaderProps) {
  const headerHeight = getDefaultHeaderHeight(props.layout, false, 0);
  return (
    <SafeAreaView>
      <View
        style={{
          flexDirection: 'row',
          minHeight: headerHeight,
          alignItems: 'center',
          paddingRight: HEADER_HORIZONTAL_PADDING,
        }}>
        <HeaderIcon.Back />
        <SearchHeaderContent />
      </View>
    </SafeAreaView>
  );
}
