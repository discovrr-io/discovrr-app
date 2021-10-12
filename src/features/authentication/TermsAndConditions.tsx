// @ts-ignore
import { PARSE_SERVER_TERMS_URL } from '@env';

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
          source={{
            uri: PARSE_SERVER_TERMS_URL || 'https://api.discovrr.com/terms',
          }}
          style={{ width: '100%' }}
        />
      </SafeAreaView>
    </>
  );
}
