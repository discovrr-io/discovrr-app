import React, { useState } from 'react';
import { SafeAreaView, View } from 'react-native';

import { getDefaultHeaderHeight } from '@react-navigation/elements';
import {
  createStackNavigator,
  StackHeaderProps,
} from '@react-navigation/stack';

import FeedNavigator from 'src/features/feed/FeedNavigator';
import SearchNavigator from 'src/features/search/SearchNavigator';

import { ExploreStackParamList } from 'src/navigation';
import { HeaderIcon, TextInput } from 'src/components';
import { color, layout } from 'src/constants';

const HEADER_HORIZONTAL_PADDING = layout.defaultScreenMargins.horizontal;
const HEADER_TEXT_INPUT_ICON_SIZE = 24;

const ExploreStack = createStackNavigator<ExploreStackParamList>();

function FeedHeaderTextInput() {
  const [searchText, setSearchText] = useState('');

  const handleSearchQuery = () => {
    const query = searchText.trim();
    if (query.length > 0) {
      console.log(`Searching '${query}'...`);
    }
  };

  return (
    <TextInput
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
            name="close"
            size={HEADER_TEXT_INPUT_ICON_SIZE}
            color={color.black}
            onPress={() => setSearchText('')}
          />
        ) : undefined
      }
      containerStyle={{
        flexGrow: 1,
        flexShrink: 1,
        marginLeft: HEADER_HORIZONTAL_PADDING,
      }}
    />
  );
}

function FeedHeader(props: StackHeaderProps) {
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
        <HeaderIcon.Menu />
        <FeedHeaderTextInput />
      </View>
    </SafeAreaView>
  );
}

export default function ExploreNavigator() {
  return (
    <ExploreStack.Navigator>
      <ExploreStack.Screen
        name="Feed"
        component={FeedNavigator}
        options={{ header: FeedHeader }}
      />
      <ExploreStack.Screen name="Search" component={SearchNavigator} />
    </ExploreStack.Navigator>
  );
}
