import React, { useEffect, useState } from 'react';
import { FlatListProps, RefreshControl, SafeAreaView } from 'react-native';

import Parse from 'parse/react-native';
import { FlatList } from 'react-native-gesture-handler';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import ProfileListItem from 'src/features/profiles/ProfileListItem';
import { color, font } from 'src/constants';
import { useIsMounted } from 'src/hooks';
import { ProfileId } from 'src/models';
import { alertSomethingWentWrong } from 'src/utilities';

import {
  EmptyContainer,
  LoadingContainer,
  PlaceholderScreen,
} from 'src/components';

import {
  SearchResultsTopTabParamList,
  SearchResultsTopTabScreenProps,
  SearchStackScreenProps,
} from 'src/navigation';

async function fetchUsersBySearchQuery(query: string): Promise<ProfileId[]> {
  const displayNameQuery = new Parse.Query(Parse.Object.extend('Profile'));
  displayNameQuery.fullText('displayName', query);
  displayNameQuery.ascending('$score');
  displayNameQuery.select('$score');

  const results = await displayNameQuery.find();
  return results.map(it => it.id as ProfileId);
}

// async function fetchMakersBySearchQuery(query: string): Promise<ProfileId[]> {
//   const businessNameQuery = new Parse.Query('VendorProfile');
//   businessNameQuery.fullText('businessName', query);
//   businessNameQuery.ascending('$score');
//   businessNameQuery.select('$score');
//
//   const displayNameQuery = new Parse.Query('VendorProfile');
//   displayNameQuery.include('profile');
//   displayNameQuery.fullText('displayName', query);
//   displayNameQuery.ascending('$score');
//   displayNameQuery.select('$score');
//
//   const results = await Parse.Query.or(
//     businessNameQuery,
//     displayNameQuery,
//   ).find();
//
//   return results.map(it => it.id as ProfileId);
// }

type SearchResultTabWrapperProps<ItemT> = SearchResultsTopTabScreenProps<
  keyof SearchResultsTopTabParamList
> & {
  fetchData: (query: string) => ItemT[] | Promise<ItemT[]>;
  renderItem: FlatListProps<ItemT>['renderItem'];
  keyExtractor?: FlatListProps<ItemT>['keyExtractor'];
};

function SearchResultsTabWrapper<ItemT>(
  props: SearchResultTabWrapperProps<ItemT>,
) {
  const $FUNC = '[SearchResultsTabWrapper]';
  const { keyExtractor, fetchData, renderItem } = props;
  const query = props.route.params.query;
  const isMounted = useIsMounted();

  const [data, setData] = useState<ItemT[]>([]);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  useEffect(() => {
    if (isInitialRender || shouldRefresh)
      (async () => {
        try {
          console.log($FUNC, `Searching '${query}'...`);
          const data = await fetchData(query);
          setData(data);
        } catch (error) {
          console.error($FUNC, 'Failed to fetch item:', error);
          alertSomethingWentWrong();
        } finally {
          if (isMounted) {
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      })();
  }, [query, fetchData, isInitialRender, shouldRefresh, isMounted]);

  const handleRefresh = () => {
    if (!isInitialRender && !shouldRefresh) setShouldRefresh(true);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          !isInitialRender ? (
            <RefreshControl
              refreshing={shouldRefresh}
              onRefresh={handleRefresh}
            />
          ) : undefined
        }
        ListEmptyComponent={
          isInitialRender ? (
            <LoadingContainer />
          ) : (
            <EmptyContainer
              title={`We couldn't find anything for '${query}'`}
              message="Try refining your search to something more specific"
            />
          )
        }
      />
    </SafeAreaView>
  );
}

type SearchResultsNavigatorProps = SearchStackScreenProps<'Results'>;

const SearchResultsTopTab =
  createMaterialTopTabNavigator<SearchResultsTopTabParamList>();

export default function SearchResultsNavigator(_: SearchResultsNavigatorProps) {
  return (
    <SearchResultsTopTab.Navigator
      initialRouteName="SearchResultsUsers"
      screenOptions={{
        lazy: true,
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: 120 },
        tabBarLabelStyle: font.defaultTabBarLabelStyle,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.gray500,
        tabBarPressColor: color.gray200,
      }}>
      <SearchResultsTopTab.Screen
        name="SearchResultsUsers"
        options={{ title: 'Users' }}>
        {props => (
          <SearchResultsTabWrapper
            {...props}
            keyExtractor={item => String(item)}
            fetchData={fetchUsersBySearchQuery}
            renderItem={({ item }) => <ProfileListItem profileId={item} />}
          />
        )}
      </SearchResultsTopTab.Screen>
      {/* <SearchResultsTopTab.Screen
        name="SearchResultsMakers"
        options={{ title: 'Makers' }}>
        {props => (
          <SearchResultsTabWrapper
            {...props}
            keyExtractor={item => String(item)}
            fetchData={fetchMakersBySearchQuery}
            renderItem={({ item }) => <ProfileListItem profileId={item} />}
          />
        )}
      </SearchResultsTopTab.Screen> */}
      <SearchResultsTopTab.Screen
        name="SearchResultsMakers"
        component={PlaceholderScreen}
        options={{ title: 'Makers' }}
      />
      <SearchResultsTopTab.Screen
        name="SearchResultsProducts"
        component={PlaceholderScreen}
        options={{ title: 'Products' }}
      />
      <SearchResultsTopTab.Screen
        name="SearchResultsWorkshops"
        component={PlaceholderScreen}
        options={{ title: 'Workshops' }}
      />
      <SearchResultsTopTab.Screen
        name="SearchResultsPosts"
        component={PlaceholderScreen}
        options={{ title: 'Posts' }}
      />
      <SearchResultsTopTab.Screen
        name="SearchResultsHashtags"
        component={PlaceholderScreen}
        options={{ title: 'Hashtags' }}
      />
    </SearchResultsTopTab.Navigator>
  );
}
