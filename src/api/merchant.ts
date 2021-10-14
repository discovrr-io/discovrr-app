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
      biography:
        result.get('biography') ||
        result.get('description') ||
        result.get('about'),
      coordinates: merchantCoordinates,
      address: {
        street: result.get('street'),
        city: result.get('city'),
        postCode: result.get('postCode'),
        state: result.get('state'),
        country: result.get('country'),
      },
    };
  }

  //#region READ OPERATIONS

  export type FetchMerchantByIdParams = {
    merchantId: MerchantId;
  };

  export async function fetchMerchantById(
    params: FetchMerchantByIdParams,
  ): Promise<Merchant> {
    const { merchantId } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const merchantQuery = new Parse.Query(Parse.Object.extend('Vendor'));

    const result = await merchantQuery.get(String(merchantId));
    return mapResultToMerchant(result, myProfile?.id);
  }

  export type FetchAllMerchantsParams = {
    pagination?: Pagination;
  };

  export async function fetchAllMerchants(
    params: FetchAllMerchantsParams,
  ): Promise<Merchant[]> {
    const { pagination } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const merchantQuery = new Parse.Query(Parse.Object.extend('Vendor'));

    // const pointOfInterest = new Parse.GeoPoint(DEFAULT_COORDINATES);
    // merchantQuery.withinKilometers('geoPoint', pointOfInterest, 50);

    if (pagination) {
      merchantQuery.limit(pagination.limit);
      merchantQuery.skip(pagination.limit * pagination.currentPage);
    }

    const results = await merchantQuery.find();
    return results.map(result => mapResultToMerchant(result, myProfile?.id));
  }

  export type FetchMerchantsNearMeParams = {
    preferences?: LocationQueryPreferences;
    pagination?: Pagination;
  };

  export async function fetchMerchantsNearMe(
    params: FetchMerchantsNearMeParams,
  ): Promise<Merchant[]> {
    const { preferences = {}, pagination } = params;
    const {
      searchRadius = DEFAULT_SEARCH_RADIUS,
      coordinates: { latitude, longitude } = DEFAULT_COORDINATES,
    } = preferences;

    console.log('Searching merchants with preferences:', {
      searchRadius,
      latitude,
      longitude,
    });

    const myProfile = await UserApi.getCurrentUserProfile();
    const merchantQuery = new Parse.Query(Parse.Object.extend('Vendor'));

    const pointOfInterest = new Parse.GeoPoint(latitude, longitude);
    merchantQuery.withinKilometers('geoPoint', pointOfInterest, searchRadius);

    if (pagination) {
      merchantQuery.limit(pagination.limit);
      merchantQuery.skip(pagination.limit * pagination.currentPage);
    }

    const results = await merchantQuery.find();
    return results
      .map(result => mapResultToMerchant(result, myProfile?.id))
      .filter((merchant): merchant is Merchant => !!merchant);
  }

  //#endregion READ OPERATIONS
}
