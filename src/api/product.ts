import Parse from 'parse/react-native';

import { Pagination } from 'src/models/common';
import { Product, ProductId, ProfileId, VendorProfileId } from 'src/models';

import { ApiError, ApiObjectStatus, CommonApiErrorCode } from './common';
import { UserApi } from './user';

export namespace ProductApi {
  export type ProductApiErrorCode = CommonApiErrorCode;
  export class ProductApiError extends ApiError<ProductApiErrorCode> {}

  function mapResultToProduct(
    result: Parse.Object,
    vendorProfileId?: string,
    myProfileId?: string,
  ): Product {
    const statistics: Parse.Object | undefined = result.get('statistics');
    const likersArray: string[] = statistics?.get('likersArray') ?? [];
    const viewersArray: string[] = statistics?.get('viewersArray') ?? [];

    const didLike = myProfileId
      ? likersArray.some(liker => myProfileId === liker)
      : false;

    return {
      id: result.id as ProductId,
      vendorId: vendorProfileId ?? result.get('profileVendor')?.id,
      squarespaceId: result.get('squarespaceId'),
      squarespaceUrl: result.get('squarespaceUrl'),
      name: result.get('name') || 'Anonymous',
      description: result.get('description') || '<NO DESCRIPTION>',
      price: result.get('price') ?? 0.0,
      media: result.get('media') ?? [],
      hidden: result.get('hidden') ?? false,
      statistics: {
        didLike,
        totalLikes: likersArray.length,
        totalViews: viewersArray.length,
        likers: likersArray as ProfileId[],
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
    const myProfile = await UserApi.getCurrentUserProfile();

    const productQuery = new Parse.Query(Parse.Object.extend('Product'));
    const result = await productQuery
      .include('profileVendor', 'statistics')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .get(productId);

    return mapResultToProduct(result, undefined, myProfile?.id);
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

    productsQuery
      .include('statistics')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .notEqualTo('hidden', true);

    if (pagination) {
      productsQuery.limit(pagination.limit);
      if (pagination.oldestDateFetched) {
        productsQuery.lessThan('createdAt', pagination.oldestDateFetched);
      } else {
        productsQuery.skip(pagination.currentPage * pagination.limit);
      }
    }

    const results = await productsQuery.find();
    return results.map(result =>
      mapResultToProduct(result, undefined, myProfile?.id),
    );
  }

  export type FetchProductsForVendorProfileParams = {
    vendorProfileId: VendorProfileId;
    pagination?: Pagination;
  };

  export async function fetchProductsForVendorProfile(
    params: FetchProductsForVendorProfileParams,
  ): Promise<Product[]> {
    const { vendorProfileId, pagination } = params;
    const profileVendorId = String(vendorProfileId);
    const profileVendorPointer: Parse.Pointer = {
      __type: 'Pointer',
      className: 'ProfileVendor',
      objectId: profileVendorId,
    };

    const currentProfile = await UserApi.getCurrentUserProfile();
    const productsQuery = new Parse.Query(Parse.Object.extend('Product'));

    productsQuery
      .include('statistics')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .equalTo('profileVendor', profileVendorPointer);

    if (pagination) {
      productsQuery.limit(pagination.limit);
      if (pagination.oldestDateFetched) {
        productsQuery.lessThan('createdAt', pagination.oldestDateFetched);
      } else {
        productsQuery.skip(pagination.currentPage * pagination.limit);
      }
    }

    const results = await productsQuery.find();
    return results.map(result =>
      mapResultToProduct(result, profileVendorId, currentProfile?.id),
    );
  }

  //#endregion READ OPERATIONS

  //#region UPDATE OPERATIONS

  export type UpdateProductLikeStatusParams = {
    productId: ProductId;
    didLike: boolean;
    sendNotification?: boolean;
  };

  export async function updateProductLikeStatus(
    params: UpdateProductLikeStatusParams,
  ) {
    await Parse.Cloud.run('updateProductLikeStatus', params);
  }

  //#endregion UPDATE OPERATIONS
}
