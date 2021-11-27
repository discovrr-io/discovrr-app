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

import * as constants from 'src/constants';
import * as searchSlice from './search-slice';
import { EmptyContainer, Spacer } from 'src/components';
import { useAppDispatch, useAppSelector, useExtendedTheme } from 'src/hooks';
import { SearchStackScreenProps } from 'src/navigation';

type SearchQueryScreenProps = SearchStackScreenProps<'SearchQuery'>;

export default function SearchQueryScreen(props: SearchQueryScreenProps) {
  const dispatch = useAppDispatch();
  const queryHistory = useAppSelector(state => state.search.queryHistory);

  const { colors } = useExtendedTheme();

  const handlePressSearchHistoryItem = (query: string) => {
    dispatch(searchSlice.addToSearchQueryHistory(query));
    props.navigation.push('SearchResults', { query });
  };

  const handleRemoveSearchHistoryItem = (index: number) => {
    dispatch(searchSlice.removeByIndexFromSearchQueryHistory(index));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <FlatList
          data={queryHistory}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: constants.layout.defaultScreenMargins.horizontal,
          }}
          ListHeaderComponent={
            <Text
              style={[
                constants.font.smallBold,
                // { color: dark ? color.gray500 : color.gray700 },
                { color: colors.caption },
              ]}>
              Previously searched
            </Text>
          }
          ListHeaderComponentStyle={{
            paddingVertical: constants.layout.defaultScreenMargins.vertical,
            paddingHorizontal: constants.layout.defaultScreenMargins.horizontal,
          }}
          ListEmptyComponent={
            <EmptyContainer
              emoji="🔍"
              message="You haven't searched for anything (yet!)"
              containerStyle={{ backgroundColor: colors.card }}
            />
          }
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
  const { colors } = useExtendedTheme();

  return (
    <TouchableHighlight
      {...restProps}
      underlayColor={colors.highlight}
      style={{ borderRadius: constants.layout.radius.sm }}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: constants.layout.spacing.md,
            paddingHorizontal: constants.layout.spacing.md * 1.5,
          },
          restProps.style,
        ]}>
        <Text
          numberOfLines={1}
          style={[
            constants.font.medium,
            { flexGrow: 1, flexShrink: 1, color: colors.text },
          ]}>
          {label}
        </Text>
        <Spacer.Horizontal value="sm" />
        <TouchableOpacity onPress={onPressRemove}>
          <Icon name="close-circle-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </TouchableHighlight>
  );
}
