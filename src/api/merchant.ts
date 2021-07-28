import Parse from 'parse/react-native';

import { DEFAULT_AVATAR_DIMENSIONS } from '../constants/media';

import { UserApi } from './user';
import { Merchant } from '../models';
import { MerchantAddress, MerchantId } from '../models/merchant';

import {
  Coordinates,
  DEFAULT_COORDINATES,
  DEFAULT_SEARCH_RADIUS,
  ImageSource,
  LocationQueryPreferences,
  Pagination,
} from '../models/common';

export namespace MerchantApi {
  function mapResultToMerchant(
    result: Parse.Object<Parse.Attributes>,
    profileId?: string,
  ): Merchant | null {
    let hasCompleteProfile = false;

    // Either a Firebase URL or nothing
    let merchantAvatar: ImageSource;
    const avatar: string | undefined = result.get('avatarUrl') || undefined;
    if (avatar) {
      hasCompleteProfile = true;
      merchantAvatar = { uri: avatar, ...DEFAULT_AVATAR_DIMENSIONS };
    } else {
      // merchantAvatar = DEFAULT_AVATAR;
      return null;
    }

    // Either a Firebase URL or a MediaSource
    // let merchantCoverPhoto: ImageSource;
    // const coverPhotoUrl: string | undefined =
    //   result.get('coverPhotoUrl') || undefined;
    // const media: MediaSource[] | undefined = result.get('media');
    // if (media && media.length > 0) {
    //   const firstPhoto = media[0];
    //   merchantCoverPhoto = {
    //     uri: firstPhoto.url,
    //     width: firstPhoto.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
    //     height: firstPhoto.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
    //   };
    // } else if (coverPhotoUrl) {
    //   const resolvedSource = Image.resolveAssetSource({ uri: coverPhotoUrl });
    //   merchantCoverPhoto = {
    //     uri: resolvedSource.uri,
    //     width: resolvedSource.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
    //     height: resolvedSource.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
    //   };
    // } else {
    //   merchantCoverPhoto = DEFAULT_IMAGE;
    // }

    let merchantCoverPhoto: ImageSource;
    const coverPhotoUrl: string | undefined =
      result.get('coverPhotoUrl') || undefined;
    if (coverPhotoUrl) {
      merchantCoverPhoto = {
        uri: coverPhotoUrl,
      };
    } else {
      return null;
    }

    let merchantCoordinates: Coordinates | undefined;
    const geoPoint: Parse.GeoPoint | undefined = result.get('geopoint');
    if (geoPoint) {
      merchantCoordinates = {
        latitude: geoPoint.latitude,
        longitude: geoPoint.longitude,
      };
    }

    const merchantAddress: MerchantAddress = {
      addressLine1: result.get('addressLine1'),
      addressLine2: result.get('addressLine2'),
      street: result.get('street'),
      city: result.get('city'),
      postCode: result.get('postCode'),
      state: result.get('state'),
      country: result.get('country'),
    };

    const likersArray: string[] = result.get('likersArray') ?? [];
    const totalLikes = likersArray.length;
    const didLike = profileId
      ? likersArray.some((liker) => profileId === liker)
      : false;

    return {
      id: result.id,
      shortName: result.get('shortName'),
      profileId: result.get('profileId'),
      avatar: merchantAvatar,
      coverPhoto: merchantCoverPhoto,
      description: result.get('about'),
      coordinates: merchantCoordinates,
      address: merchantAddress,
      statistics: {
        didSave: false,
        didLike,
        totalLikes,
        totalViews: result.get('viewersCount') ?? 0,
      },
      __distanceToDefaultPoint: geoPoint?.kilometersTo(
        new Parse.GeoPoint(DEFAULT_COORDINATES),
      ),
      __hasCompleteProfile: hasCompleteProfile,
    } as Merchant;
  }

  // async function getCurrentProfile(): Promise<Parse.Object<Parse.Attributes> | null> {
  //   const currentUser = await Parse.User.currentAsync();
  //   if (!currentUser) return null;

  //   const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
  //   profileQuery.equalTo('owner', currentUser);

  //   const profile = await profileQuery.first();
  //   console.log('Found current user profile:', profile?.id);
  //   return profile;
  // }

  export async function fetchAllMerchants(pagination?: Pagination) {
    const $FUNC = '[MerchantApi.fetchAllMerchants]';

    try {
      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Vendor'));
      query.exists('avatarUrl');
      query.exists('coverPhotoUrl');

      const pointOfInterest = new Parse.GeoPoint(DEFAULT_COORDINATES);
      query.withinKilometers('geopoint', pointOfInterest, 50);

      if (pagination) {
        query.limit(pagination.limit);
        query.skip(pagination.limit * pagination.currentPage);
      }

      const results = await query.find();

      // Filter out all the null values (i.e. merchants not partnered with us)
      return results
        .map((result) => mapResultToMerchant(result, profile?.id))
        .filter(Boolean);
    } catch (error) {
      console.error($FUNC, 'Failed to fetch all merchants:', error);
      throw error;
    }
  }

  // TODO: Try-catch
  export async function fetchMerchantsNearMe(
    preferences?: LocationQueryPreferences,
    pagination?: Pagination,
  ): Promise<Merchant[]> {
    const {
      searchRadius = DEFAULT_SEARCH_RADIUS,
      coordinates: { latitude, longitude } = DEFAULT_COORDINATES,
    } = preferences ?? {};

    console.log('Searching merchants with preferences:', {
      searchRadius,
      latitude,
      longitude,
    });

    const profile = await UserApi.getCurrentUserProfile();
    const query = new Parse.Query(Parse.Object.extend('Vendor'));
    query.exists('avatarUrl');
    query.exists('coverPhotoUrl');

    const pointOfInterest = new Parse.GeoPoint(latitude, longitude);
    query.withinKilometers('geopoint', pointOfInterest, searchRadius);

    if (pagination) {
      query.limit(pagination.limit);
      query.skip(pagination.limit * pagination.currentPage);
    }

    const results = await query.find();
    return results.map((result) => mapResultToMerchant(result, profile?.id));
  }

  export async function fetchMerchantById(
    merchantId: string,
  ): Promise<Merchant | null> {
    try {
      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Vendor'));
      query.equalTo('objectId', merchantId);
      query.exists('avatarUrl');
      query.exists('coverPhotoUrl');

      const result = await query.first();
      return mapResultToMerchant(result, profile?.id);
    } catch (error) {
      console.error('Failed to fetch merchant by id:', error);
      throw error;
    }
  }

  export async function changeMerchantLikeStatus(
    merchantId: MerchantId,
    didLike: boolean,
  ) {
    const $FUNC = '[MerchantApi.changeMerchantLikeStatus]';

    try {
      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Vendor'));
      query.equalTo('objectId', merchantId);

      const merchant = await query.first();
      console.log($FUNC, 'Found merchant:', merchant.id);

      const profileLikedVendorsRelation = profile.relation('likedVendors');
      const profileLikedVendorsArray = profile.get('likedVendorsArray') ?? [];
      const profileLikedVendorsSet = new Set<string>(profileLikedVendorsArray);

      const merchantLikersRelation = merchant.relation('likers');
      const merchantLikersArray = merchant.get('likersArray') ?? [];
      const merchantLikersSet = new Set<string>(merchantLikersArray);

      if (didLike) {
        console.log($FUNC, 'Adding liked merchant...');
        profileLikedVendorsRelation.add(merchant);
        profileLikedVendorsSet.add(merchant.id);

        console.log($FUNC, 'Adding liker profile...');
        merchantLikersRelation.add(profile);
        merchantLikersSet.add(profile.id);
      } else {
        console.log($FUNC, 'Removing liked merchant...');
        profileLikedVendorsRelation.remove(merchant);
        profileLikedVendorsSet.delete(merchant.id);

        console.log($FUNC, 'Removing liker profile...');
        merchantLikersRelation.remove(profile);
        merchantLikersSet.delete(profile.id);
      }

      profile.set('likedVendorsArray', [...profileLikedVendorsSet]);
      profile.set('likedVendorsCount', profileLikedVendorsSet.size);
      merchant.set('likersArray', [...merchantLikersSet]);
      merchant.set('likersCount', merchantLikersSet.size);

      console.log($FUNC, 'Saving changes...');
      await Promise.all([profile.save(), merchant.save()]);
      console.log($FUNC, 'Successfully saved');
    } catch (error) {
      console.error(
        $FUNC,
        `Failed to ${didLike ? 'like' : 'unlike'} merchant:`,
        error,
      );
      throw error;
    }
  }

  export async function updateMerchantViewCounter(merchantId: string) {
    const $FUNC = '[MerchantApi.updateMerchantViewCounter]';

    try {
      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Vendor'));
      query.equalTo('objectId', merchantId);

      const merchant = await query.first();
      console.log($FUNC, 'Found merchant:', merchant.id);

      const profileViewedMerchantsRelation = profile.relation('viewedVendors');
      const profileViewedMerchantsArray =
        profile.get('viewedVendorsArray') ?? [];
      const profileViewedMerchantsSet = new Set<string>(
        profileViewedMerchantsArray,
      );

      console.log($FUNC, 'Adding viewed merchant...');
      profileViewedMerchantsRelation.add(merchant);
      profileViewedMerchantsSet.add(merchant.id);
      profile.set('viewedVendorsArray', [...profileViewedMerchantsSet]);
      profile.set('viewedVendorsCount', profileViewedMerchantsSet.size);

      const productViewersRelation = merchant.relation('viewers');
      const productViewersArray = merchant.get('viewersArray') ?? [];
      const productViewersSet = new Set<string>(productViewersArray);

      console.log($FUNC, 'Adding viewer profile...');
      productViewersRelation.add(profile);
      merchant.set('viewersArray', [...productViewersSet.add(profile.id)]);
      // A "view" is counted as the number of times a user has visited the
      // product's page spaced out in 5 minute intervals. If the last visit was
      // less than 5 minutes ago, it will NOT be counted as a view.
      merchant.increment('viewersCount');

      console.log($FUNC, 'Saving changes...');
      await Promise.all([profile.save(), merchant.save()]);
      console.log($FUNC, 'Successfully saved');
    } catch (error) {
      console.error($FUNC, 'Failed to update viewers for merchant:', error);
      throw error;
    }
  }
}
