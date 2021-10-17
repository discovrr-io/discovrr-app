import React, { useEffect, useState } from 'react';
import { FlatListProps, RefreshControl, SafeAreaView } from 'react-native';

import Parse from 'parse/react-native';
import { FlatList } from 'react-native-gesture-handler';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import ProfileListItem from 'src/features/profiles/ProfileListItem';
import { font } from 'src/constants';
import { EmptyContainer } from 'src/components';
import { useIsMounted } from 'src/hooks';
import { ProfileId } from 'src/models';
import { alertSomethingWentWrong } from 'src/utilities';

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
  const { keyExtractor, fetchData, renderItem } = props;
  const query = props.route.params.query;
  const isMounted = useIsMounted();

  const [data, setData] = useState<ItemT[]>([]);
  const [shouldRefresh, setShouldRefresh] = useState(true);

  useEffect(() => {
    if (shouldRefresh)
      (async () => {
        try {
          console.log(`WILL SEARCH '${query}'`);
          const data = await fetchData(query);
          console.log('DONE:', data);
          setData(data);
        } catch (error) {
          console.error('Failed to fetch item:', error);
          alertSomethingWentWrong();
        } finally {
          if (isMounted && shouldRefresh) setShouldRefresh(false);
        }
      })();
  }, [query, fetchData, isMounted, shouldRefresh]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={shouldRefresh}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <EmptyContainer
            title={`We couldn't find anything for '${query}'`}
            message="Try refining your search to something more specific"
          />
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
        tabBarLabelStyle: font.defaultTabBarLabelStyle,
        tabBarItemStyle: { width: 100 },
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
    </SearchResultsTopTab.Navigator>
  );
}
