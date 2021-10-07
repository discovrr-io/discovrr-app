import Parse from 'parse/react-native';

import { Pagination } from 'src/models/common';
import { Product, ProductId } from 'src/models';

import { UserApi } from './user';
import { ApiError, CommonApiErrorCode } from './common';

export namespace ProductApi {
  export type ProductApiErrorCode = CommonApiErrorCode;
  export class ProductApiError extends ApiError<ProductApiErrorCode> {}

  function mapResultToProduct(
    result: Parse.Object,
    merchantId?: string,
    _myProfileId?: string,
  ): Product {
    // const likersArray: string[] = result.get('likersArray') ?? [];
    // const totalLikes = likersArray.length;
    // const didLike = myProfileId
    //   ? likersArray.some(liker => myProfileId === liker)
    //   : false;

    return {
      id: result.id as ProductId,
      merchantId: merchantId ?? result.get('owner').id,
      name: result.get('name') || result.get('productName'),
      description:
        result.get('description') || result.get('productDescription'),
      price: result.get('price') || result.get('productPrice'),
      squareSpaceUrl: result.get('squareSpaceUrl'),
      imageUrl: result.get('imageUrl'),
      statistics: {
        didSave: false,
        didLike: false,
        totalLikes: 0,
        totalViews: 0,
      },
    };
  }

  export async function fetchAllProducts(
    pagination?: Pagination,
  ): Promise<Product[]> {
    const profile = await UserApi.getCurrentUserProfile();
    const query = new Parse.Query(Parse.Object.extend('Product'));

    if (pagination) {
      query.limit(pagination.limit);
      query.skip(pagination.limit * pagination.currentPage);
    }

    const results = await query.find();
    return results.map(result =>
      mapResultToProduct(result, undefined, profile?.id),
    );
  }

  export async function fetchProductsForMerchant(
    merchantId: string,
  ): Promise<Product[]> {
    const vendorPointer = {
      __type: 'Pointer',
      className: 'Vendor',
      objectId: merchantId,
    };

    const currentProfile = await UserApi.getCurrentUserProfile();
    const query = new Parse.Query(Parse.Object.extend('Product'));
    query.equalTo('owner', vendorPointer);

    const results = await query.find();
    return results.map(result =>
      mapResultToProduct(result, merchantId, currentProfile?.id),
    );
  }

  export async function fetchProductById(productId: string): Promise<Product> {
    // const $FUNC = '[ProductApi.fetchProductById]';
    // const profile = await UserApi.getCurrentUserProfile();
    // const postQuery = new Parse.Query(Parse.Object.extend('Product'));
    // postQuery.equalTo('objectId', productId);

    // const result = await postQuery.first();
    // if (result) {
    //   return mapResultToProduct(result);
    // } else {
    //   console.warn($FUNC, 'No profile found with id:', profile?.id);
    //   throw new ProductApiError(
    //     'NOT_FOUND',
    //     `No product was found with the ID '${productId}'.`,
    //   );
    // }

    const productQuery = new Parse.Query(Parse.Object.extend('Product'));
    const result = await productQuery.include('statistics').get(productId);

    // if (!result)
    //   throw new ProductApiError(
    //     'NOT_FOUND',
    //     `No product was found with the ID '${productId}'`,
    //   );

    return mapResultToProduct(result);
  }

  export async function updateProductLikeStatus(
    productId: string,
    didLike: boolean,
  ) {
    const $FUNC = '[ProductApi.updateProductLikeStatus]';

    const myProfile = await UserApi.getCurrentUserProfile();
    if (!myProfile) throw new UserApi.UserNotFoundApiError();

    const query = new Parse.Query(Parse.Object.extend('Product'));
    query.equalTo('objectId', productId);

    const product = await query.first();
    if (!product)
      throw new ProductApiError(
        'NOT_FOUND',
        `Failed to find product with ID '${productId}'`,
      );

    const profileLikedProductsRelation = myProfile.relation('likedProducts');
    const profileLikedProductsArray = myProfile.get('likedProductsArray') ?? [];
    const profileLikedProductsSet = new Set<string>(profileLikedProductsArray);

    const productLikersRelation = product.relation('likers');
    const productLikersArray = product.get('likersArray') ?? [];
    const productLikersSet = new Set<string>(productLikersArray);

    if (didLike) {
      console.log($FUNC, 'Adding liked product...');
      profileLikedProductsRelation.add(product);
      profileLikedProductsSet.add(product.id);
      myProfile.increment('likedProductsCount');

      console.log($FUNC, 'Adding liker profile...');
      productLikersRelation.add(myProfile);
      productLikersSet.add(myProfile.id);
      product.increment('likersCount');
    } else {
      console.log($FUNC, 'Removing liked product...');
      profileLikedProductsRelation.remove(product);
      profileLikedProductsSet.delete(product.id);
      myProfile.decrement('likedProductsCount');

      console.log($FUNC, 'Removing liker profile...');
      productLikersRelation.remove(myProfile);
      productLikersSet.delete(myProfile.id);
      product.decrement('likersCount');
    }

    myProfile.set('likedProductsArray', [...profileLikedProductsSet]);
    product.set('likersArray', [...productLikersSet]);

    console.log($FUNC, 'Saving...');
    await Promise.all([myProfile.save(), product.save()]);
    console.log($FUNC, 'Done!');
  }

  export async function updateProductViewCounter(productId: string) {
    const $FUNC = '[ProductApi.updateProductViewCounter]';

    const profile = await UserApi.getCurrentUserProfile();
    if (!profile) throw new UserApi.UserNotFoundApiError();

    const query = new Parse.Query(Parse.Object.extend('Product'));
    query.equalTo('objectId', productId);

    const product = await query.first();
    if (!product)
      throw new ProductApiError(
        'NOT_FOUND',
        `Failed to find product with ID '${productId}'`,
      );

    const profileViewedProductsRelation = profile.relation('viewedProducts');
    const profileViewedProductsArray = profile.get('viewedProductsArray') ?? [];
    const profileViewedProductsSet = new Set<string>(
      profileViewedProductsArray,
    );

    console.log($FUNC, 'Adding viewed product...');
    profileViewedProductsRelation.add(product);
    profileViewedProductsSet.add(product.id);
    profile.set('viewedProductsArray', [...profileViewedProductsSet]);
    profile.set('viewedProductsCount', profileViewedProductsSet.size);

    const productViewersRelation = product.relation('viewers');
    const productViewersArray = product.get('viewersArray') ?? [];
    const productViewersSet = new Set<string>(productViewersArray);

    console.log($FUNC, 'Adding viewer profile...');
    productViewersRelation.add(profile);
    product.set('viewersArray', [...productViewersSet.add(profile.id)]);
    // A "view" is counted as the number of times a user has visited the
    // product's page spaced out in 5 minute intervals. If the last visit was
    // less than 5 minutes ago, it will NOT be counted as a view.
    product.increment('viewersCount');

    console.log($FUNC, 'Saving changes...');
    await Promise.all([profile.save(), product.save()]);
    console.log($FUNC, 'Successfully saved');
  }
}
