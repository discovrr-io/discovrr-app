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
  ImageSource,
  LocationQueryPreferences,
  DEFAULT_SEARCH_RADIUS,
  DEFAULT_COORDINATES,
} from '../models/common';

export namespace MerchantApi {
  export async function fetchMerchantsNearMe(
    preferences?: LocationQueryPreferences,
  ): Promise<Merchant[]> {
    const {
      searchRadius = DEFAULT_SEARCH_RADIUS,
      coordinates: { latitude, longitude } = DEFAULT_COORDINATES,
    } = preferences ?? {};

    const query = new Parse.Query(Parse.Object.extend('Vendor'));
    const pointOfInterest = new Parse.GeoPoint(latitude, longitude);
    query.withinKilometers('geopoint', pointOfInterest, searchRadius);
    query.limit(100);

    const results = await query.find();
    return results.map((merchant) => {
      let hasCompleteProfile = false;

      // Either a Firebase URL or nothing
      let merchantAvatar: ImageSource;
      const avatar: string | undefined = merchant.get('avatarUrl');
      if (avatar) {
        hasCompleteProfile = true;
        merchantAvatar = { uri: avatar, ...DEFAULT_AVATAR_DIMENSIONS };
      } else {
        merchantAvatar = DEFAULT_AVATAR;
      }

      // Either a Firebase URL or a MediaSource
      let merchantCoverPhoto: ImageSource;
      const coverPhotoUrl: string | undefined = merchant.get('coverPhotoUrl');
      const media: MediaSource[] | undefined = merchant.get('media');
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
        hasCompleteProfile = true;
      } else {
        merchantCoverPhoto = DEFAULT_IMAGE;
      }

      return {
        id: merchant.id,
        shortName: merchant.get('shortName'),
        geoPoint: merchant.get('geoPoint'),
        profileId: merchant.get('profileId'),
        avatar: merchantAvatar,
        coverPhoto: merchantCoverPhoto,
        description: merchant.get('about'),
        __hasCompleteProfile: hasCompleteProfile,
      } as Merchant;
    });
  }
}
