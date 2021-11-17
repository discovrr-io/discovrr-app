import * as React from 'react';
import { Platform } from 'react-native';

import { RootStack } from 'src/navigation';
import ProductDetailsScreen from './ProductDetailsScreen';

export default function renderProductNavigator() {
  return (
    <RootStack.Group>
      <RootStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={({ route }) => ({
          title: route.params.productName || 'Product',
          headerTitleContainerStyle: {
            width: Platform.OS === 'ios' ? '75%' : '90%',
            alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
          },
        })}
      />
    </RootStack.Group>
  );
}
