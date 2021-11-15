import React from 'react';

import { DEFAULT_TILE_SPACING } from 'src/constants/values';
import { MasonryList, MasonryListProps } from 'src/components';
import { ProductId } from 'src/models';

import ProductItemCard from './ProductItemCard';
import { ScrollView } from 'react-native';

type ProductMasonryListProps<ItemT> = Omit<
  MasonryListProps<ItemT>,
  'data' | 'renderItem'
> & {
  productIds: ProductId[];
  tileSpacing?: number;
  smallContent?: boolean;
};

function ProductMasonryListInner<ItemT>(
  props: ProductMasonryListProps<ItemT>,
  ref: React.ForwardedRef<ScrollView>,
) {
  const {
    productIds,
    tileSpacing = DEFAULT_TILE_SPACING,
    smallContent = false,
    contentContainerStyle,
    ...restProps
  } = props;

  return (
    <MasonryList
      {...restProps}
      ref={ref}
      data={productIds}
      contentContainerStyle={[
        productIds.length === 0 && { flexGrow: 1 },
        contentContainerStyle,
      ]}
      renderItem={({ item: productId, column }) => (
        <ProductItemCard
          productId={productId}
          key={productId}
          elementOptions={{ smallContent }}
          style={{
            marginTop: tileSpacing,
            marginLeft: column % 2 === 0 ? tileSpacing : tileSpacing / 2,
            marginRight: column % 2 !== 0 ? tileSpacing : tileSpacing / 2,
          }}
        />
      )}
    />
  );
}

const ProductMasonryList = React.forwardRef(ProductMasonryListInner);

export default ProductMasonryList;
