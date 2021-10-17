import React from 'react';
import { SafeAreaView, Text } from 'react-native';

import { font } from 'src/constants';
import { SearchStackScreenProps } from 'src/navigation';

type SearchResultsProps = SearchStackScreenProps<'Results'>;

export default function SearchResults(props: SearchResultsProps) {
  const query = props.route.params.query;
  return (
    <SafeAreaView
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[font.mediumBold]}>GOT QUERY: {`'${query}'`}</Text>
    </SafeAreaView>
  );
}
