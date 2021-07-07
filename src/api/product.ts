import Parse from 'parse/react-native';

import { Product } from '../models';

export namespace ProductApi {
  function mapResultToProduct(
    result: Parse.Object<Parse.Attributes>,
    merchantId?: string,
  ): Product {
    return {
      id: result.id,
      merchantId: merchantId ?? result.get('owner').id,
      name: result.get('productName'),
      description: result.get('productProduct'),
      price: result.get('price'),
      squareSpaceUrl: result.get('squareSpaceUrl'),
      imageUrl: result.get('imageUrl'),
    };
  }

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
      return results.map((result) => mapResultToProduct(result, merchantId));
    } catch (error) {
      console.error(`Failed to fetch products for merchant:`, error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
}
