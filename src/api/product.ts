import Parse from 'parse/react-native';

import { UserApi } from './user';
import { Pagination } from '../models/common';
import { Product } from '../models';

export namespace ProductApi {
  function mapResultToProduct(
    result: Parse.Object<Parse.Attributes>,
    merchantId?: string,
    profileId?: string,
  ): Product {
    const likersArray: string[] = result.get('likersArray') ?? [];
    const totalLikes = likersArray.length;
    const didLike = profileId
      ? likersArray.some((liker) => profileId === liker)
      : false;

    return {
      id: result.id,
      merchantId: merchantId ?? result.get('owner').id,
      name: result.get('productName'),
      description: result.get('productProduct'),
      price: result.get('price'),
      squareSpaceUrl: result.get('squareSpaceUrl'),
      imageUrl: result.get('imageUrl'),
      statistics: {
        didSave: false,
        didLike,
        totalLikes,
        totalViews: result.get('viewersCount') ?? 0,
      },
    } as Product;
  }

  export async function fetchAllProducts(
    pagination?: Pagination,
  ): Promise<Product[]> {
    const $FUNC = '[ProductApi.fetchAllProducts]';

    try {
      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Product'));

      if (pagination) {
        query.limit(pagination.limit);
        query.skip(pagination.limit * pagination.currentPage);
      }

      const results = await query.find();
      return results.map((result) =>
        mapResultToProduct(result, undefined, profile?.id),
      );
    } catch (error) {
      console.error($FUNC, `Failed to fetch distinct product:`, error);
      throw error;
    }
  }

  export async function fetchProductsForMerchant(
    merchantId: string,
  ): Promise<Product[]> {
    const $FUNC = '[ProductApi.fetchProductsForMerchant]';

    try {
      const vendorPointer = {
        __type: 'Pointer',
        className: 'Vendor',
        objectId: merchantId,
      };

      const currentProfile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Product'));
      query.equalTo('owner', vendorPointer);

      const results = await query.find();
      return results.map((result) =>
        mapResultToProduct(result, merchantId, currentProfile?.id),
      );
    } catch (error) {
      console.error($FUNC, `Failed to fetch products for merchant:`, error);
      throw error;
    }
  }

  // TODO: Rename to `updateProductLikeStatus`
  export async function changeProductLikeStatus(
    productId: string,
    didLike: boolean,
  ) {
    const $FUNC = '[ProductApi.changeProductLikeStatus]';

    try {
      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Product'));
      query.equalTo('objectId', productId);

      const product = await query.first();
      console.log($FUNC, 'Found product:', product.id);

      const profileLikedProductsRelation = profile.relation('likedProducts');
      const profileLikedProductsArray = profile.get('likedProductsArray') ?? [];
      const profileLikedProductsSet = new Set<string>(
        profileLikedProductsArray,
      );

      const productLikersRelation = product.relation('likers');
      const productLikersArray = product.get('likersArray') ?? [];
      const productLikersSet = new Set<string>(productLikersArray);

      if (didLike) {
        console.log($FUNC, 'Adding liked product...');
        profileLikedProductsRelation.add(product);
        profileLikedProductsSet.add(product.id);
        profile.increment('likedProductsCount');

        console.log($FUNC, 'Adding liker profile...');
        productLikersRelation.add(profile);
        productLikersSet.add(profile.id);
        product.increment('likersCount');
      } else {
        console.log($FUNC, 'Removing liked product...');
        profileLikedProductsRelation.remove(product);
        profileLikedProductsSet.delete(product.id);
        profile.decrement('likedProductsCount');

        console.log($FUNC, 'Removing liker profile...');
        productLikersRelation.remove(profile);
        productLikersSet.delete(profile.id);
        product.decrement('likersCount');
      }

      profile.set('likedProductsArray', [...profileLikedProductsSet]);
      product.set('likersArray', [...productLikersSet]);

      console.log($FUNC, 'Saving...');
      await Promise.all([profile.save(), product.save()]);
      console.log($FUNC, 'Done!');
    } catch (error) {
      console.error(
        $FUNC,
        `Failed to ${didLike ? 'like' : 'unlike'} product:`,
        error,
      );
      throw error;
    }
  }

  export async function updateProductViewCounter(productId: string) {
    const $FUNC = '[ProductApi.updateProductViewCounter]';

    try {
      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Product'));
      query.equalTo('objectId', productId);

      const product = await query.first();
      console.log($FUNC, 'Found product:', product.id);

      const profileViewedProductsRelation = profile.relation('viewedProducts');
      const profileViewedProductsArray =
        profile.get('viewedProductsArray') ?? [];
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
    } catch (error) {
      console.error($FUNC, 'Failed to update viewers for product:', error);
      throw error;
    }
  }
}
