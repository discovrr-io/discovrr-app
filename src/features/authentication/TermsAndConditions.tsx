// @ts-ignore
// import { PARSE_SERVER_TERMS_URL } from '@env';

import React from 'react';

import WebView from 'react-native-webview';
import { SafeAreaView, StatusBar } from 'react-native';

const TERMS_AND_CONDITIONS = require('../../../assets/Terms-and-Conditions.html');

export default function TermsAndConditionsScreen() {
  return (
    <>
      <StatusBar animated barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          allowFileAccess
          originWhitelist={['file://']}
          source={TERMS_AND_CONDITIONS}
          // FIXME: This just renders a blank page
          // source={{
          //   uri: PARSE_SERVER_TERMS_URL ?? 'http://192.168.0.4:1337/terms',
          // }}
          style={{ width: '100%' }}
        />
      </SafeAreaView>
    </>
  );
}
