import React, { useEffect, useState } from 'react';
import { FlatListProps, RefreshControl, SafeAreaView } from 'react-native';

import _ from 'lodash';
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

function sortProfileIdsByOccurrence(profileIds: string[]): ProfileId[] {
  return _.chain(profileIds)
    .countBy() // Count all the occurrences
    .toPairs() // Map to a [profileId, occurrence] tuple pair
    .sortBy(1) // Sort by the second index of the tuple (the occurrence)
    .reverse() // Reverse the result - descending order
    .map(([id]) => id as ProfileId) // Map out all the profileIds
    .value();
}

async function fetchUsersBySearchQuery(query: string): Promise<ProfileId[]> {
  const displayNameQuery = new Parse.Query('Profile')
    .fullText('displayName', query)
    .ascending('$score')
    .select('$score');

  const biographyQuery = new Parse.Query('Profile')
    .fullText('biography', query)
    .ascending('$score')
    .select('$score', 'profile');

  const [displayNameResults, biographyResults] = await Promise.all([
    displayNameQuery.find(),
    biographyQuery.find(),
  ]);

  const displayNameResultsProfileIds = displayNameResults.map(item => item.id);
  const biographyResultsProfileIds = biographyResults.map(item => item.id);

  console.log({
    displayNameResultsProfileIds,
    biographyResultsProfileIds,
  });

  const allProfileIds = [
    ...displayNameResultsProfileIds,
    ...biographyResultsProfileIds,
  ];

  return sortProfileIdsByOccurrence(allProfileIds);
}

async function fetchMakersBySearchQuery(query: string): Promise<ProfileId[]> {
  const businessNameQuery = new Parse.Query('ProfileVendor')
    .include('profile')
    .fullText('businessName', query)
    .ascending('$score')
    .select('$score', 'profile');

  const displayNameQuery = new Parse.Query(Parse.Object.extend('Profile'))
    .equalTo('kind', 'vendor')
    .fullText('displayName', query)
    .ascending('$score')
    .select('$score');

  const biographyQuery = new Parse.Query(Parse.Object.extend('Profile'))
    .equalTo('kind', 'vendor')
    .fullText('biography', query)
    .ascending('$score')
    .select('$score', 'profile');

  const [businessNameResults, displayNameResults, biographyResults] =
    await Promise.all([
      businessNameQuery.find(),
      displayNameQuery.find(),
      biographyQuery.find(),
    ]);

  const getProfileId = (item: Parse.Object): string => item.get('profile').id;
  const businessNameResultsProfileIds = businessNameResults.map(getProfileId);
  const biographyResultsProfileIds = biographyResults.map(item => item.id);
  const displayNameResultsProfileIds = displayNameResults.map(item => item.id);

  console.log({
    businessNameResultsProfileIds,
    displayNameResultsProfileIds,
    biographyResultsProfileIds,
  });

  const allProfileIds = [
    ...businessNameResultsProfileIds,
    ...displayNameResultsProfileIds,
    ...biographyResultsProfileIds,
  ];

  return sortProfileIdsByOccurrence(allProfileIds);
}

type SearchResultTabWrapperProps<ItemT> = SearchResultsTopTabScreenProps<
  keyof SearchResultsTopTabParamList
> & {
  query: string;
  fetchData: (query: string) => ItemT[] | Promise<ItemT[]>;
  renderItem: FlatListProps<ItemT>['renderItem'];
  keyExtractor?: FlatListProps<ItemT>['keyExtractor'];
};

function SearchResultsTabWrapper<ItemT>(
  props: SearchResultTabWrapperProps<ItemT>,
) {
  const $FUNC = '[SearchResultsTabWrapper]';
  const { query, fetchData, renderItem, keyExtractor } = props;
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

type SearchResultsNavigatorProps = SearchStackScreenProps<'SearchResults'>;

const SearchResultsTopTab =
  createMaterialTopTabNavigator<SearchResultsTopTabParamList>();

export default function SearchResultsNavigator(
  props: SearchResultsNavigatorProps,
) {
  const query = props.route.params.query;
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
            query={query}
            fetchData={fetchUsersBySearchQuery}
            renderItem={({ item }) => <ProfileListItem profileId={item} />}
            keyExtractor={item => String(item)}
          />
        )}
      </SearchResultsTopTab.Screen>
      <SearchResultsTopTab.Screen
        name="SearchResultsMakers"
        options={{ title: 'Makers' }}>
        {props => (
          <SearchResultsTabWrapper
            {...props}
            query={query}
            fetchData={fetchMakersBySearchQuery}
            renderItem={({ item }) => <ProfileListItem profileId={item} />}
            keyExtractor={item => String(item)}
          />
        )}
      </SearchResultsTopTab.Screen>
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
