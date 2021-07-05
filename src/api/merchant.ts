import { Image } from 'react-native';

import Parse from 'parse/react-native';
import { MediaSource } from '.';
import {
  DEFAULT_AVATAR,
  DEFAULT_AVATAR_DIMENSIONS,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_DIMENSIONS,
} from '../constants/media';

import { Merchant } from '../models';

import {
  DEFAULT_COORDINATES,
  DEFAULT_SEARCH_RADIUS,
  ImageSource,
  LocationQueryPreferences,
  Pagination,
} from '../models/common';

export namespace MerchantApi {
  function mapResultToMerchant(
    result: Parse.Object<Parse.Attributes>,
  ): Merchant {
    let hasCompleteProfile = false;

    // Either a Firebase URL or nothing
    let merchantAvatar: ImageSource;
    const avatar: string | undefined = result.get('avatarUrl') || undefined;
    if (avatar) {
      hasCompleteProfile = true;
      merchantAvatar = { uri: avatar, ...DEFAULT_AVATAR_DIMENSIONS };
    } else {
      merchantAvatar = DEFAULT_AVATAR;
    }

    // Either a Firebase URL or a MediaSource
    let merchantCoverPhoto: ImageSource;
    const coverPhotoUrl: string | undefined =
      result.get('coverPhotoUrl') || undefined;
    const media: MediaSource[] | undefined = result.get('media');
    if (media && media.length > 0) {
      const firstPhoto = media[0];
      merchantCoverPhoto = {
        uri: firstPhoto.url,
        width: firstPhoto.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
        height: firstPhoto.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
      };
    } else if (coverPhotoUrl) {
      const resolvedSource = Image.resolveAssetSource({ uri: coverPhotoUrl });
      merchantCoverPhoto = {
        uri: resolvedSource.uri,
        width: resolvedSource.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
        height: resolvedSource.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
      };
    } else {
      merchantCoverPhoto = DEFAULT_IMAGE;
    }

    return {
      id: result.id,
      shortName: result.get('shortName'),
      geoPoint: result.get('geoPoint'),
      profileId: result.get('profileId'),
      avatar: merchantAvatar,
      coverPhoto: merchantCoverPhoto,
      description: result.get('about'),
      __hasCompleteProfile: hasCompleteProfile,
    } as Merchant;
  }

  export async function fetchAllMerchants(pagination?: Pagination) {
    console.log('MerchantApi.fetchAllMerchants');

    const query = new Parse.Query(Parse.Object.extend('Vendor'));

    if (pagination) {
      query.limit(pagination.limit);
      query.skip(pagination.limit * pagination.currentPage);
    }

    const results = await query.find();
    return results
      .map(mapResultToMerchant)
      .filter((merchant) => merchant.__hasCompleteProfile);
  }

  export async function fetchMerchantsNearMe(
    preferences?: LocationQueryPreferences,
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

    const query = new Parse.Query(Parse.Object.extend('Vendor'));
    const pointOfInterest = new Parse.GeoPoint(latitude, longitude);
    query.withinKilometers('geopoint', pointOfInterest, searchRadius);
    query.limit(100);

    const results = await query.find();
    return results.map(mapResultToMerchant);
  }
}
