import { TypedUseAsyncItem, useAsyncItem } from 'src/hooks';
import { Product, ProductId } from 'src/models';

import {
  fetchProductById,
  selectProductById,
  selectProductStatusById,
} from './productsSlice';

export const useProduct: TypedUseAsyncItem<ProductId, Product | undefined> =
  productId => {
    return useAsyncItem(
      'product',
      productId,
      fetchProductById({ productId }), // We won't reload by default
      selectProductById,
      selectProductStatusById,
    );
  };
