import React, { useCallback, useRef, useState } from 'react';
import { TextInput as RNTextInput, SafeAreaView, View } from 'react-native';

import { getDefaultHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackHeaderProps } from '@react-navigation/stack';

import { Button, Spacer, TextInput } from 'src/components';
import { color, layout } from 'src/constants';
import { SearchStackNavigationProp } from 'src/navigation';

const HEADER_HORIZONTAL_PADDING = layout.defaultScreenMargins.horizontal;
const HEADER_TEXT_INPUT_ICON_SIZE = 24;

function SearchHeaderContent() {
  const navigation = useNavigation<SearchStackNavigationProp>();

  const textInputRef = useRef<RNTextInput>(null);
  const [searchText, setSearchText] = useState('');

  // Focus the text input when the screen with the header is focused
  useFocusEffect(
    useCallback(() => {
      textInputRef.current?.focus();
    }, []),
  );

  const handleClearQuery = () => {
    setSearchText('');
    navigation.navigate('Query');
    textInputRef.current?.focus();
  };

  const handleSearchQuery = () => {
    const query = searchText.trim();
    if (query.length > 0) {
      navigation.navigate('Results', {
        screen: 'SearchResultsUsers',
        params: { query },
      });
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
      autoCapitalize="none"
      autoCompleteType="off"
      autoCorrect={false}
      prefix={
        <TextInput.Icon
          name="search"
          size={HEADER_TEXT_INPUT_ICON_SIZE * 0.9}
        />
      }
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
          paddingHorizontal: HEADER_HORIZONTAL_PADDING,
        }}>
        <SearchHeaderContent />
        <Spacer.Horizontal value="md" />
        <Button
          title="Cancel"
          size="medium"
          onPress={() => props.navigation.goBack()}
          containerStyle={{ alignItems: 'flex-end', paddingHorizontal: 0 }}
        />
      </View>
    </SafeAreaView>
  );
}
