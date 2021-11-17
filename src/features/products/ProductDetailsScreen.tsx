import * as React from 'react';

import { AsyncGate, InAppWebView, LoadingContainer } from 'src/components';
import { RootStackScreenProps } from 'src/navigation';

import { useProduct } from './hooks';

type ProductDetailsScreenProps = RootStackScreenProps<'ProductDetails'>;

export default function ProductDetailsScreen(props: ProductDetailsScreenProps) {
  const { productId } = props.route.params;
  const productData = useProduct(productId);

  return (
    <AsyncGate
      data={productData}
      onPending={() => <LoadingContainer />}
      onFulfilled={product => {
        if (!product || !product.squarespaceUrl) return null;
        return <InAppWebView source={{ uri: product.squarespaceUrl }} />;
      }}
    />
  );
}
