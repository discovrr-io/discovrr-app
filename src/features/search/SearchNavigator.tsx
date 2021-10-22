import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  TextInput as RNTextInput,
  SafeAreaView,
  StyleProp,
  ViewStyle,
  Text,
  View,
  TouchableHighlight,
  Platform,
  Keyboard,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { getDefaultHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import {
  CardStyleInterpolators,
  createStackNavigator,
  HeaderStyleInterpolators,
  StackHeaderProps,
} from '@react-navigation/stack';

import { color, font, layout } from 'src/constants';
import { Button, HeaderIcon, Spacer, TextInput } from 'src/components';
import { useAppDispatch } from 'src/hooks';

import {
  SearchStackNavigationProp,
  SearchStackParamList,
} from 'src/navigation';

import SearchQueryScreen from './SearchQueryScreen';
import SearchResultsNavigator from './SearchResultsNavigator';
import { addToSearchQueryHistory } from './search-slice';

const HEADER_HORIZONTAL_PADDING = layout.defaultScreenMargins.horizontal;
const HEADER_TEXT_INPUT_ICON_SIZE = 24;

function SearchHeaderContent(props: { initialText?: string }) {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<SearchStackNavigationProp>();

  const textInputRef = useRef<RNTextInput>(null);
  const [searchText, setSearchText] = useState('');

  // Focus the text input when the navigation is focused
  useFocusEffect(
    useCallback(() => {
      textInputRef.current?.focus();
    }, []),
  );

  useEffect(() => {
    if (props.initialText) setSearchText(props.initialText);
  }, [props.initialText]);

  const handleClearQuery = () => {
    setSearchText('');
    textInputRef.current?.focus();
  };

  const handleSearchQuery = () => {
    const query = searchText.trim();
    if (query.length > 0) {
      dispatch(addToSearchQueryHistory(query));
      navigation.navigate('SearchResults', { query });
    }
  };

  return (
    <TextInput
      ref={textInputRef}
      size="medium"
      placeholder="Search for anything…"
      value={searchText}
      onChangeText={setSearchText}
      onSubmitEditing={handleSearchQuery}
      selectTextOnFocus
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

function SearchHeader(
  props: React.PropsWithChildren<
    StackHeaderProps & { containerStyle?: StyleProp<ViewStyle> }
  >,
) {
  const headerHeight = getDefaultHeaderHeight(props.layout, false, 0);
  return (
    <SafeAreaView>
      <View
        style={[
          {
            flexDirection: 'row',
            minHeight: headerHeight,
            alignItems: 'center',
          },
          props.containerStyle,
        ]}>
        {props.children}
      </View>
    </SafeAreaView>
  );
}

type SearchQueryHeaderProps = StackHeaderProps & {
  query?: string;
};

function SearchQueryHeader(props: SearchQueryHeaderProps) {
  const { query, ...restProps } = props;

  const handleCancelSearch = () => {
    Keyboard.dismiss();
    props.navigation.goBack();
  };

  return (
    <SearchHeader
      {...restProps}
      containerStyle={{ paddingHorizontal: HEADER_HORIZONTAL_PADDING }}>
      <SearchHeaderContent initialText={query} />
      <Spacer.Horizontal value="md" />
      <Button
        title="Cancel"
        size="medium"
        onPress={handleCancelSearch}
        containerStyle={{ alignItems: 'flex-end', paddingHorizontal: 0 }}
      />
    </SearchHeader>
  );
}

type SearchResultsHeaderProps = StackHeaderProps & {
  query?: string;
};

function SearchResultsHeader(props: SearchResultsHeaderProps) {
  const { query, ...restProps } = props;

  const handleNavigateBackToQueryScreen = () => {
    restProps.navigation.navigate('SearchQuery', { query });
  };

  return (
    <SearchHeader
      {...restProps}
      containerStyle={{ paddingRight: HEADER_HORIZONTAL_PADDING }}>
      <HeaderIcon.Back onPress={handleNavigateBackToQueryScreen} />
      <TouchableHighlight
        underlayColor={color.gray200}
        onPress={handleNavigateBackToQueryScreen}
        onLongPress={handleNavigateBackToQueryScreen}
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          height: layout.buttonSizes.md,
          paddingVertical: layout.spacing.sm,
          paddingHorizontal: layout.spacing.md * 1.3,
          borderRadius: layout.radius.sm,
          backgroundColor: color.gray100,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="search" size={18} />
          <Spacer.Horizontal value="sm" />
          <Text style={font.medium}>{query ?? 'Search for anything…'}</Text>
        </View>
      </TouchableHighlight>
    </SearchHeader>
  );
}

const SearchStack = createStackNavigator<SearchStackParamList>();

export default function SearchNavigator() {
  return (
    <SearchStack.Navigator
      initialRouteName="SearchQuery"
      screenOptions={{
        // headerShown: false,
        headerTintColor: color.black,
        headerBackTitleVisible: false,
        headerTitleStyle: font.defaultHeaderTitleStyle,
        headerStyleInterpolator: Platform.select({
          android: HeaderStyleInterpolators.forFade,
          default: undefined,
        }),
        cardStyleInterpolator: Platform.select({
          android: CardStyleInterpolators.forFadeFromCenter,
          default: undefined,
        }),
      }}>
      <SearchStack.Screen
        name="SearchQuery"
        component={SearchQueryScreen}
        options={({ route }) => {
          const query = route.params?.query;
          return {
            header: props => <SearchQueryHeader {...props} query={query} />,
          };
        }}
      />
      <SearchStack.Screen
        name="SearchResults"
        component={SearchResultsNavigator}
        options={({ route }) => {
          const query = route.params.query;
          return {
            header: props => <SearchResultsHeader {...props} query={query} />,
            headerStyle: {
              elevation: 0,
              shadowOpacity: 0,
            },
          };
        }}
      />
    </SearchStack.Navigator>
  );
}
