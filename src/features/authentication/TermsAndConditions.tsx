import * as React from 'react';

import { SafeAreaView, StatusBar } from 'react-native';
import { InAppWebView } from 'src/components';
import { useExtendedTheme } from 'src/hooks';

export default function TermsAndConditionsScreen() {
  const { dark } = useExtendedTheme();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <StatusBar
        animated
        translucent
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
      />
      <InAppWebView
        allowFileAccess
        source={{ uri: 'https://api.discovrrio.com/terms' }}
      />
    </SafeAreaView>
  );
}
