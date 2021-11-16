import Parse from 'parse/react-native';

import { Pagination } from 'src/models/common';
import { Product, ProductId, VendorProfileId } from 'src/models';

import { ApiError, ApiObjectStatus, CommonApiErrorCode } from './common';
import { UserApi } from './user';

export namespace ProductApi {
  export type ProductApiErrorCode = CommonApiErrorCode;
  export class ProductApiError extends ApiError<ProductApiErrorCode> {}

  function mapResultToProduct(
    result: Parse.Object,
    vendorProfileId?: string,
    _myProfileId?: string,
  ): Product {
    // const likersArray: string[] = result.get('likersArray') ?? [];
    // const totalLikes = likersArray.length;
    // const didLike = myProfileId
    //   ? likersArray.some(liker => myProfileId === liker)
    //   : false;

    return {
      id: result.id as ProductId,
      vendorId: vendorProfileId ?? result.get('profileVendor').id,
      squarespaceId: result.get('squarespaceId'),
      squarespaceUrl: result.get('squarespaceUrl'),
      name: result.get('name') || '<NO NAME>',
      description: result.get('description') || '<NO DESCRIPTION>',
      price: result.get('price') || 0.0,
      media: result.get('media') || [],
      statistics: {
        didSave: false,
        didLike: false,
        totalLikes: 0,
        totalViews: 0,
      },
    };
  }

  //#region CREATE OPERATIONS

  export type CreateProductParams = Pick<
    Product,
    'name' | 'description' | 'price'
  > & {
    hashtags?: string[];
    categories?: string[];
    hidden?: boolean;
  };

  export async function createProduct(
    params: CreateProductParams,
  ): Promise<Product> {
    const result: Parse.Object = await Parse.Cloud.run('createProduct', params);
    const myProfile = await UserApi.getCurrentUserProfile();
    return mapResultToProduct(result, undefined, myProfile?.id);
  }

  //#endregion CREATE OPERATIONS

  //#region READ OPERATIONS

  export type FetchProductByIdParams = {
    productId: ProductId;
  };

  export async function fetchProductById(
    params: FetchProductByIdParams,
  ): Promise<Product> {
    const productId = String(params.productId);
    const productQuery = new Parse.Query(Parse.Object.extend('Product'));
    const result = await productQuery
      .include('statistics')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .get(productId);

    return mapResultToProduct(result);
  }

  export type FetchAllProductsParams = {
    pagination?: Pagination;
  };

  export async function fetchAllProducts(
    params: FetchAllProductsParams,
  ): Promise<Product[]> {
    const { pagination } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const productsQuery = new Parse.Query(Parse.Object.extend('Product'));
    productsQuery.notEqualTo('status', ApiObjectStatus.DELETED);

    if (pagination) {
      productsQuery
        .skip(pagination.currentPage * pagination.limit)
        .limit(pagination.limit);
    }

    const results = await productsQuery.find();
    return results.map(result =>
      mapResultToProduct(result, undefined, myProfile?.id),
    );
  }

  export type FetchProductsForVendorProfileParams = {
    vendorProfileId: VendorProfileId;
  };

  export async function fetchProductsForVendorProfile(
    params: FetchProductsForVendorProfileParams,
  ): Promise<Product[]> {
    const profileVendorId = String(params.vendorProfileId);
    const profileVendorPointer: Parse.Pointer = {
      __type: 'Pointer',
      className: 'ProfileVendor',
      objectId: profileVendorId,
    };

    const currentProfile = await UserApi.getCurrentUserProfile();
    const query = new Parse.Query(Parse.Object.extend('Product'));
    query
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .equalTo('profileVendor', profileVendorPointer);

    const results = await query.find();
    return results.map(result =>
      mapResultToProduct(result, profileVendorId, currentProfile?.id),
    );
  }

  //#endregion READ OPERATIONS
}
