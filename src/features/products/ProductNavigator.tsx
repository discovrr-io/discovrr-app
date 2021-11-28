import * as React from 'react';

import { layout } from 'src/constants';
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
          headerTitleContainerStyle: layout.defaultHeaderTitleContainerStyle,
        })}
      />
    </RootStack.Group>
  );
}
