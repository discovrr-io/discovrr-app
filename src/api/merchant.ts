import Parse from 'parse/react-native';

import Merchant, { MerchantId } from 'src/models/merchant';

import {
  Coordinates,
  DEFAULT_COORDINATES,
  DEFAULT_SEARCH_RADIUS,
  LocationQueryPreferences,
  Pagination,
} from 'src/models/common';

import { UserApi } from './user';
import { ApiError, CommonApiErrorCode } from './common';

export namespace MerchantApi {
  export type MerchantApiErrorCode = CommonApiErrorCode | 'MERCHANT_NOT_FOUND';
  export class MerchantApiError extends ApiError<MerchantApiErrorCode> {}

  // function __mapResultToMerchant(
  //   result: Parse.Object,
  //   myProfileId?: string,
  // ): Merchant | null {
  //   // Either a Firebase URL or nothing
  //   let merchantAvatar: ImageSource;
  //   const avatar: string | undefined = result.get('avatarUrl') || undefined;
  //   if (avatar) {
  //     merchantAvatar = { uri: avatar, ...DEFAULT_AVATAR_DIMENSIONS };
  //   } else {
  //     // merchantAvatar = DEFAULT_AVATAR;
  //     return null;
  //   }
  //
  //   // Either a Firebase URL or a ImageSource
  //   // let merchantCoverPhoto: ImageSource;
  //   // const coverPhotoUrl: string | undefined =
  //   //   result.get('coverPhotoUrl') || undefined;
  //   // const media: MediaSource[] | undefined = result.get('media');
  //   // if (media && media.length > 0) {
  //   //   const firstPhoto = media[0];
  //   //   merchantCoverPhoto = {
  //   //     uri: firstPhoto.url,
  //   //     width: firstPhoto.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
  //   //     height: firstPhoto.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
  //   //   };
  //   // } else if (coverPhotoUrl) {
  //   //   const resolvedSource = Image.resolveAssetSource({ uri: coverPhotoUrl });
  //   //   merchantCoverPhoto = {
  //   //     uri: resolvedSource.uri,
  //   //     width: resolvedSource.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
  //   //     height: resolvedSource.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
  //   //   };
  //   // } else {
  //   //   merchantCoverPhoto = DEFAULT_IMAGE;
  //   // }
  //
  //   let merchantCoverPhoto: ImageSource;
  //   const coverPhotoUrl: string | undefined =
  //     result.get('coverPhotoUrl') || undefined;
  //   if (coverPhotoUrl) {
  //     merchantCoverPhoto = {
  //       uri: coverPhotoUrl,
  //     };
  //   } else {
  //     return null;
  //   }
  //
  //   let merchantCoordinates: Coordinates | undefined;
  //   const geoPoint: Parse.GeoPoint | undefined = result.get('geopoint');
  //   if (geoPoint) {
  //     merchantCoordinates = {
  //       latitude: geoPoint.latitude,
  //       longitude: geoPoint.longitude,
  //     };
  //   }
  //
  //   const merchantAddress: MerchantAddress = {
  //     addressLine1: result.get('addressLine1'),
  //     addressLine2: result.get('addressLine2'),
  //     street: result.get('street'),
  //     city: result.get('city'),
  //     postCode: result.get('postCode'),
  //     state: result.get('state'),
  //     country: result.get('country'),
  //   };
  //
  //   const likersArray: string[] = result.get('likersArray') ?? [];
  //   const totalLikes = likersArray.length;
  //   const didLike = myProfileId
  //     ? likersArray.some(liker => myProfileId === liker)
  //     : false;
  //
  //   return {
  //     id: result.id as MerchantId,
  //     shortName: result.get('shortName'),
  //     profileId: result.get('profileId'),
  //     avatar: merchantAvatar,
  //     coverPhoto: merchantCoverPhoto,
  //     description: result.get('about'),
  //     coordinates: merchantCoordinates,
  //     address: merchantAddress,
  //     statistics: {
  //       didSave: false,
  //       didLike,
  //       totalLikes,
  //       totalViews: result.get('viewersCount') ?? 0,
  //     },
  //     __distanceToDefaultPoint: geoPoint?.kilometersTo(
  //       new Parse.GeoPoint(DEFAULT_COORDINATES),
  //     ),
  //     __hasCompleteProfile: true,
  //   };
  // }

  function mapResultToMerchant(
    result: Parse.Object,
    _myProfileId?: string,
  ): Merchant {
    // let merchantAvatar: ImageSource | undefined = undefined;
    // const avatar: MediaSource | undefined = result.get('avatar');
    // if (avatar) {
    //   merchantAvatar = {
    //     uri: avatar.url,
    //     width: avatar.width ?? DEFAULT_AVATAR_DIMENSIONS.width,
    //     height: avatar.height ?? DEFAULT_AVATAR_DIMENSIONS.height,
    //   };
    // }

    // let merchantCoverPhoto: ImageSource | undefined = undefined;
    // const coverPhoto: MediaSource | undefined = result.get('coverPhoto');
    // if (coverPhoto) {
    //   merchantCoverPhoto = {
    //     uri: coverPhoto.url,
    //     width: coverPhoto.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
    //     height: coverPhoto.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
    //   };
    // }

    let merchantCoordinates: Coordinates | undefined;
    const geoPoint: Parse.GeoPoint | undefined = result.get('geoPoint');
    if (geoPoint) {
      merchantCoordinates = {
        latitude: geoPoint.latitude,
        longitude: geoPoint.longitude,
      };
    }

    return {
      id: result.id as MerchantId,
      shortName: result.get('shortName'),
      profileId: result.get('profileId'),
      avatar: result.get('avatar'),
      coverPhoto: result.get('coverPhoto'),
      description: result.get('description'),
      biography: result.get('biography') || result.get('description'),
      coordinates: merchantCoordinates,
      address: {
        addressLine1: result.get('addressLine1'),
        addressLine2: result.get('addressLine2'),
        street: result.get('street'),
        city: result.get('city'),
        postCode: result.get('postCode'),
        state: result.get('state'),
        country: result.get('country'),
      },
    };
  }

  export async function fetchAllMerchants(
    pagination?: Pagination,
  ): Promise<Merchant[]> {
    const myProfile = await UserApi.getCurrentUserProfile();
    const merchantQuery = new Parse.Query(Parse.Object.extend('Vendor'));
    merchantQuery.exists('avatarUrl');
    merchantQuery.exists('coverPhotoUrl');

    const pointOfInterest = new Parse.GeoPoint(DEFAULT_COORDINATES);
    merchantQuery.withinKilometers('geoPoint', pointOfInterest, 50);

    if (pagination) {
      merchantQuery.limit(pagination.limit);
      merchantQuery.skip(pagination.limit * pagination.currentPage);
    }

    const results = await merchantQuery.find();

    // Filter out all the null values (i.e. merchants not partnered with us)
    return results
      .map(result => mapResultToMerchant(result, myProfile?.id))
      .filter((merchant): merchant is Merchant => !!merchant);
  }

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

    const myProfile = await UserApi.getCurrentUserProfile();
    const merchantQuery = new Parse.Query(Parse.Object.extend('Vendor'));
    merchantQuery.exists('avatarUrl');
    merchantQuery.exists('coverPhotoUrl');

    const pointOfInterest = new Parse.GeoPoint(latitude, longitude);
    merchantQuery.withinKilometers('geopoint', pointOfInterest, searchRadius);

    if (pagination) {
      merchantQuery.limit(pagination.limit);
      merchantQuery.skip(pagination.limit * pagination.currentPage);
    }

    const results = await merchantQuery.find();
    return results
      .map(result => mapResultToMerchant(result, myProfile?.id))
      .filter((merchant): merchant is Merchant => !!merchant);
  }

  export async function fetchMerchantById(
    merchantId: string,
  ): Promise<Merchant | null> {
    const myProfile = await UserApi.getCurrentUserProfile();
    const merchantQuery = new Parse.Query(Parse.Object.extend('Vendor'));
    merchantQuery.equalTo('objectId', merchantId);
    merchantQuery.exists('avatarUrl');
    merchantQuery.exists('coverPhotoUrl');

    const result = await merchantQuery.first();
    if (!result) return null;
    return mapResultToMerchant(result, myProfile?.id);
  }

  export async function updateMerchantLikeStatus(
    _merchantId: string,
    _didLike: boolean,
  ) {
    throw new Error('Unimplemented error');
    // const $FUNC = '[MerchantApi.updateMerchantLikeStatus]';
    // await Parse.Cloud.run('updateMerchantLikeStatus', { merchantId, didLike });
    // console.log($FUNC, `Successfully ${!didLike ? 'un' : ''}liked merchant`);
  }

  export async function updateMerchantViewCounter(merchantId: string) {
    const $FUNC = '[MerchantApi.updateMerchantViewCounter]';

    const myProfile = await UserApi.getCurrentUserProfile();
    if (!myProfile) throw new UserApi.UserNotFoundApiError();

    const query = new Parse.Query(Parse.Object.extend('Vendor'));
    query.equalTo('objectId', merchantId);

    const merchant = await query.first();
    console.log($FUNC, 'Found merchant:', merchant?.id);
    if (!merchant)
      throw new MerchantApiError(
        'MERCHANT_NOT_FOUND',
        `Failed to find merchant with id: '${merchantId}'`,
      );

    const profileViewedMerchantsRelation = myProfile.relation('viewedVendors');
    const profileViewedMerchantsArray =
      myProfile.get('viewedVendorsArray') ?? [];
    const profileViewedMerchantsSet = new Set<string>(
      profileViewedMerchantsArray,
    );

    console.log($FUNC, 'Adding viewed merchant...');
    profileViewedMerchantsRelation.add(merchant);
    profileViewedMerchantsSet.add(merchant.id);
    myProfile.set('viewedVendorsArray', [...profileViewedMerchantsSet]);
    myProfile.set('viewedVendorsCount', profileViewedMerchantsSet.size);

    const productViewersRelation = merchant.relation('viewers');
    const productViewersArray = merchant.get('viewersArray') ?? [];
    const productViewersSet = new Set<string>(productViewersArray);

    console.log($FUNC, 'Adding viewer profile...');
    productViewersRelation.add(myProfile);
    merchant.set('viewersArray', [...productViewersSet.add(myProfile.id)]);
    // A "view" is counted as the number of times a user has visited the
    // product's page spaced out in 5 minute intervals. If the last visit was
    // less than 5 minutes ago, it will NOT be counted as a view.
    merchant.increment('viewersCount');

    console.log($FUNC, 'Saving changes...');
    await Promise.all([myProfile.save(), merchant.save()]);
    console.log($FUNC, 'Successfully saved');
  }
}
