import React from 'react';

import WebView from 'react-native-webview';
import { SafeAreaView, StatusBar } from 'react-native';

export default function TermsAndConditionsScreen() {
  return (
    <>
      <StatusBar animated barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          allowFileAccess
          source={{ uri: 'https://api.discovrrio.com/terms' }}
          style={{ width: '100%' }}
        />
      </SafeAreaView>
    </>
  );
}
