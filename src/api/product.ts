import Parse from 'parse/react-native';

import { Product } from '../models';

export namespace ProductApi {
  export async function fetchProductsForMerchant(
    merchantId: string,
  ): Promise<Product[]> {
    try {
      console.group('ProductApi.fetchProductsForMerchant');
      const vendorPointer = {
        __type: 'Pointer',
        className: 'Vendor',
        objectId: merchantId,
      };

      const query = new Parse.Query(Parse.Object.extend('Product'));
      query.equalTo('owner', vendorPointer);

      const results = await query.find();
      return results.map(
        (product) =>
          ({
            id: product.id,
            merchantId,
            name: product.get('productName'),
            description: product.get('productProduct'),
            price: product.get('price'),
            squareSpaceUrl: product.get('squareSpaceUrl'),
            imageUrl: product.get('imageUrl'),
          } as Product),
      );
    } catch (error) {
      console.error(`Failed to fetch products for merchant:`, error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
}
