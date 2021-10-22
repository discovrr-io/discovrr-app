import React from 'react';
import {
  FlatList,
  Keyboard,
  SafeAreaView,
  Text,
  TouchableHighlight,
  TouchableHighlightProps,
  TouchableOpacity,
  TouchableOpacityProps,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import * as searchSlice from './search-slice';
import { Spacer } from 'src/components';
import { color, font, layout } from 'src/constants';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { SearchStackScreenProps } from 'src/navigation';

type SearchQueryScreenProps = SearchStackScreenProps<'SearchQuery'>;

export default function SearchQueryScreen(props: SearchQueryScreenProps) {
  const dispatch = useAppDispatch();
  const queryHistory = useAppSelector(state => state.search.queryHistory);

  const handlePressSearchHistoryItem = (query: string) => {
    dispatch(searchSlice.addToSearchQueryHistory(query));
    props.navigation.push('SearchResults', { query });
  };

  const handleRemoveSearchHistoryItem = (index: number) => {
    dispatch(searchSlice.removeByIndexFromSearchQueryHistory(index));
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <FlatList
          data={queryHistory}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: layout.defaultScreenMargins.horizontal,
          }}
          ListHeaderComponent={
            <Text style={[font.smallBold, { color: color.gray700 }]}>
              Previously searched
            </Text>
          }
          ListHeaderComponentStyle={{
            paddingTop: layout.defaultScreenMargins.vertical,
            paddingHorizontal: layout.defaultScreenMargins.horizontal,
          }}
          renderItem={({ item: query, index }) => (
            <SearchHistoryItem
              label={query}
              onPress={() => handlePressSearchHistoryItem(query.trim())}
              onPressRemove={() => handleRemoveSearchHistoryItem(index)}
            />
          )}
        />
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

type SearchHistoryItemProps = TouchableHighlightProps & {
  label: string;
  onPressRemove?: TouchableOpacityProps['onPress'];
};

function SearchHistoryItem(props: SearchHistoryItemProps) {
  const { label, onPressRemove, ...restProps } = props;
  return (
    <TouchableHighlight {...restProps} underlayColor={color.gray100}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: layout.spacing.md,
            paddingHorizontal: layout.spacing.md * 1.5,
          },
          restProps.style,
        ]}>
        <Text
          numberOfLines={1}
          style={[font.medium, { flexGrow: 1, flexShrink: 1 }]}>
          {label}
        </Text>
        <Spacer.Horizontal value="sm" />
        <TouchableOpacity onPress={onPressRemove}>
          <Icon name="close-circle-outline" size={20} />
        </TouchableOpacity>
      </View>
    </TouchableHighlight>
  );
}
