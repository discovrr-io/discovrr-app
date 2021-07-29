import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';

import analytics from '@react-native-firebase/analytics';
import WebView from 'react-native-webview';
import { useRoute } from '@react-navigation/core';

import { LoadingTabView, RouteError } from '../../components';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { selectProductById, updateProductViewCounter } from './productsSlice';

// TODO: Refactor out
function isOverFiveMinutes(date) {
  if (!date) return false;

  const FIVE_MINS = 5 * 60 * 1000;
  const now = new Date();
  const then = new Date(date);
  return now - then > FIVE_MINS;
}

export default function ProductCheckoutScreen() {
  const FUNC = '[ProductCheckoutScreen]';
  const dispatch = useAppDispatch();

  const { productId } = useRoute().params ?? {};
  const product = useAppSelector((state) =>
    selectProductById(state, productId),
  );

  if (!product) {
    console.error(FUNC, 'Failed to select product with id:', productId);
    return <RouteError />;
  }

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { lastViewed } = product.statistics ?? {};

    // We don't want to count views in development mode
    if (!lastViewed || isOverFiveMinutes(lastViewed)) {
      if (!__DEV__) {
        console.log(FUNC, 'Updating last viewed date-time...');
        dispatch(
          updateProductViewCounter({
            productId,
            lastViewed: new Date().toJSON(),
          }),
        );
      }

      // If on debug mode, Firebase Analytics will automatically send this event
      // to the DebugView (and thus won't pollute events in production)
      (async () => {
        try {
          await analytics().logViewItem({
            items: [
              {
                item_id: productId,
                item_name: product.name,
                price: product.price,
                quantity: 1,
              },
            ],
          });
        } catch (error) {
          console.error(FUNC, 'Failed to send `view_item` event:', error);
        }
      })();
    }
  }, []);

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
        source={{ uri: product.squareSpaceUrl }}
        onLoadEnd={(_) => setIsLoading(false)}
        style={{ width: '100%', opacity: isLoading ? 0 : 1 }}
      />
    </SafeAreaView>
  );
}
