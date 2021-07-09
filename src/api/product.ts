import Parse from 'parse/react-native';

import { UserApi } from '.';
import { Pagination } from '../models/common';
import { Product, ProductId } from '../models';

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

      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Product'));
      query.equalTo('owner', vendorPointer);

      const results = await query.find();
      return results.map((result) =>
        mapResultToProduct(result, merchantId, profile?.id),
      );
    } catch (error) {
      console.error(`Failed to fetch products for merchant:`, error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  export async function fetchAllProducts(
    pagination?: Pagination,
  ): Promise<Product[]> {
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
      console.error(`Failed to fetch distinct product:`, error);
      throw error;
    }
  }

  export async function changeProductLikeStatus(
    productId: ProductId,
    didLike: boolean,
  ) {
    try {
      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Product'));
      query.equalTo('objectId', productId);

      const product = await query.first();
      console.log('Found product:', product.id);

      const profileLikedProductsRelation = profile.relation('likedProducts');
      const profileLikedProductsArray = profile.get('likedProductsArray') ?? [];
      const profileLikedProductsSet = new Set<string>(
        profileLikedProductsArray,
      );

      const productLikersRelation = product.relation('likers');
      const productLikersArray = product.get('likersArray') ?? [];
      const productLikersSet = new Set<string>(productLikersArray);

      if (didLike) {
        console.log('Adding liked product...');
        profileLikedProductsRelation.add(product);
        profileLikedProductsSet.add(product.id);
        profile.increment('likedProductsCount');

        console.log('Adding liker profile...');
        productLikersRelation.add(profile);
        productLikersSet.add(profile.id);
        product.increment('likersCount');
      } else {
        console.log('Removing liked product...');
        profileLikedProductsRelation.remove(product);
        profileLikedProductsSet.delete(product.id);
        profile.decrement('likedProductsCount');

        console.log('Removing liker profile...');
        productLikersRelation.remove(profile);
        productLikersSet.delete(profile.id);
        product.decrement('likersCount');
      }

      profile.set('likedProductsArray', [...profileLikedProductsSet]);
      product.set('likersArray', [...productLikersSet]);

      console.log('Saving...');
      await Promise.all([profile.save(), product.save()]);
      console.log('Done!');
    } catch (error) {
      console.error(`Failed to ${didLike ? 'like' : 'unlike'} product:`, error);
      throw error;
    }
  }
}
