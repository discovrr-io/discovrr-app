import * as React from 'react';

import { WebViewProps } from 'react-native-webview';
import { StackNavigationOptions } from '@react-navigation/stack';

import { RootStackScreenProps } from 'src/navigation';
import { InAppWebView } from 'src/components';

export const IN_APP_WEBVIEW_SCREEN_PREDEFINED_DESTINATIONS = [
  'about-discovrr',
  'privacy-policy',
  'terms-and-conditions',
] as const;

export type InAppWebViewScreenPredefinedDestination =
  typeof IN_APP_WEBVIEW_SCREEN_PREDEFINED_DESTINATIONS[number];

export type InAppWebViewScreenDestination =
  | InAppWebViewScreenPredefinedDestination
  | { uri: string };

export type InAppWebViewNavigationScreenParams = {
  title: string;
  destination: InAppWebViewScreenDestination;
  presentation?: StackNavigationOptions['presentation'];
};

type InAppWebViewScreenProps = RootStackScreenProps<'InAppWebView'>;

export default function InAppWebViewScreen(props: InAppWebViewScreenProps) {
  const { destination } = props.route.params;

  let source: WebViewProps['source'];
  if (typeof destination === 'string') {
    let resolvedDestination: string;

    switch (destination) {
      case 'about-discovrr':
        resolvedDestination = 'https://discovrr.com.au/about';
        break;
      case 'privacy-policy':
        resolvedDestination = 'https://discovrr.com.au/privacy';
        break;
      case 'terms-and-conditions':
        resolvedDestination = 'https://api.discovrrio.com/terms';
        break;
      default:
        console.warn('Received invalid destination:', destination);
        resolvedDestination = '';
        break;
    }

    source = { uri: resolvedDestination };
  } else {
    source = destination;
  }

  return (
    <InAppWebView allowFileAccess source={source} style={{ width: '100%' }} />
  );
}
