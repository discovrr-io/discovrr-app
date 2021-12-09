import * as React from 'react';

import {
  AsyncGate,
  InAppWebView,
  LoadingContainer,
  RouteError,
} from 'src/components';
import { RootStackScreenProps } from 'src/navigation';

import { useProduct } from './hooks';

type ProductDetailsScreenProps = RootStackScreenProps<'ProductDetails'>;

export default function ProductDetailsScreen(props: ProductDetailsScreenProps) {
  const { productId } = props.route.params;
  const productData = useProduct(productId);

  const renderRouteError = () => {
    return (
      <RouteError message="We weren't able to find this product. It may have been deleted or set to hidden." />
    );
  };

  return (
    <AsyncGate
      data={productData}
      onPending={() => <LoadingContainer />}
      onRejected={renderRouteError}
      onFulfilled={product => {
        if (!product || !product.squarespaceUrl) return renderRouteError();
        return <InAppWebView source={{ uri: product.squarespaceUrl }} />;
      }}
    />
  );
}
