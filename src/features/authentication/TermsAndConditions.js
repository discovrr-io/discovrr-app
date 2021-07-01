import React from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native';

import WebView from 'react-native-webview';

const TERMS_AND_CONDITIONS = require('../../../resources/Terms-and-Conditions.html');

export default function TermsAndConditions() {
  return (
    <>
      <StatusBar animated barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          originWhitelist={['file://']}
          source={TERMS_AND_CONDITIONS}
          style={{ width: '100%' }}
        />
      </SafeAreaView>
    </>
  );
}
