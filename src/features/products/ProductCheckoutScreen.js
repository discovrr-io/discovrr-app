import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

import WebView from 'react-native-webview';
import { useRoute } from '@react-navigation/core';
import { LoadingTabView, RouteError } from '../../components';

export default function ProductCheckoutScreen() {
  const { squareSpaceUrl = undefined } = useRoute().params ?? {};

  const [isLoading, setIsLoading] = useState(true);

  if (!squareSpaceUrl) {
    console.error('[ProductCheckoutScreen] squareSpaceUrl is undefined');
    return <RouteError />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LoadingTabView
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
        }}
      />
      <WebView
        source={{ uri: squareSpaceUrl }}
        onLoadEnd={(_) => setIsLoading(false)}
        style={{ width: '100%', opacity: isLoading ? 0 : 1 }}
      />
    </SafeAreaView>
  );
}
