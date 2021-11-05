import * as React from 'react';

import { PlaceholderScreen } from 'src/components';
import { RootStackScreenProps } from 'src/navigation';

type ProductDetailsScreenProps = RootStackScreenProps<'ProductDetails'>;

export default function ProductDetailsScreen(_: ProductDetailsScreenProps) {
  return <PlaceholderScreen />;
}
