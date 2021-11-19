import * as React from 'react';

import { SafeAreaView, StatusBar } from 'react-native';
import { InAppWebView } from 'src/components';

export default function TermsAndConditionsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <StatusBar
        animated
        translucent
        barStyle="dark-content"
        backgroundColor="transparent"
      />
      <InAppWebView
        allowFileAccess
        source={{ uri: 'https://api.discovrrio.com/terms' }}
      />
    </SafeAreaView>
  );
}
