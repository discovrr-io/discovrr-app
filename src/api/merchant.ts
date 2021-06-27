import Parse from 'parse/react-native';
import { MediaSource } from '.';
import {
  DEFAULT_AVATAR,
  DEFAULT_AVATAR_DIMENSIONS,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_DIMENSIONS,
} from '../constants/media';

import { Merchant } from '../models';
import { ImageSource, LocationQueryPreferences } from '../models/common';

export namespace MerchantApi {
  const DEFAULT_SEARCH_RADIUS = 3;
  const DEFAULT_LOCATION_PREFS = {
    searchRadius: DEFAULT_SEARCH_RADIUS,
    coordinates: {
      // Redfern Coordinates
      latitude: -33.89296377479401,
      longitude: 151.20546154794323,
    },
  };

  export async function fetchMerchantsNearMe(
    preferences?: LocationQueryPreferences,
  ): Promise<Merchant[]> {
    const {
      searchRadius,
      coordinates: { latitude, longitude },
    } = preferences ?? DEFAULT_LOCATION_PREFS;

    const query = new Parse.Query(Parse.Object.extend('Vendor'));
    const pointOfInterest = new Parse.GeoPoint(latitude, longitude);
    query.withinKilometers('geopoint', pointOfInterest, searchRadius);
    query.limit(30);

    const results = await query.find();
    return results.map((merchant) => {
      // Either a Firebase URL or nothing
      let merchantAvatar: ImageSource;
      const avatar: string | undefined = merchant.get('avatarUrl');
      if (avatar) {
        merchantAvatar = { uri: avatar, ...DEFAULT_AVATAR_DIMENSIONS };
      } else {
        merchantAvatar = DEFAULT_AVATAR;
      }

      // Either a Firebase URL or a MediaSource
      let merchantCoverPhoto: ImageSource;
      const coverPhotoUrl: string | undefined = merchant.get('coverPhotoUrl');
      const media: MediaSource[] | undefined = merchant.get('media');
      if (coverPhotoUrl) {
        merchantCoverPhoto = {
          uri: coverPhotoUrl,
          ...DEFAULT_IMAGE_DIMENSIONS,
        };
      } else if (media && media.length > 0) {
        const firstPhoto = media[0];
        merchantCoverPhoto = {
          uri: firstPhoto.url,
          width: firstPhoto.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
          height: firstPhoto.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
        };
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
      };
    });
  }
}
