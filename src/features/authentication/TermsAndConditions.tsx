import * as React from 'react';

import WebView from 'react-native-webview';
import { ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { color } from 'src/constants';

export default function TermsAndConditionsScreen() {
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <>
      <StatusBar
        animated
        translucent
        barStyle="dark-content"
        backgroundColor="transparent"
      />
      <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
        <WebView
          allowFileAccess
          source={{ uri: 'https://api.discovrrio.com/terms' }}
          onLoad={_ => setIsLoading(false)}
          style={{ width: '100%' }}
        />
        {isLoading && (
          <ActivityIndicator
            size="large"
            color={color.gray500}
            style={{
              position: 'absolute',
              alignSelf: 'center',
              transform: [{ scale: 2.0 }],
            }}
          />
        )}
      </SafeAreaView>
    </>
  );
}
