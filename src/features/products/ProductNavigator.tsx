import * as React from 'react';

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
        })}
      />
    </RootStack.Group>
  );
}
