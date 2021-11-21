import * as React from 'react';
import { Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/core';

import * as constants from 'src/constants';
import { MediaSource } from 'src/api';
import { AsyncGate, Card } from 'src/components';
import { useIsMyProfile, useProfile } from 'src/features/profiles/hooks';
import { ProfileId, VendorProfile } from 'src/models';
import { RootStackNavigationProp } from 'src/navigation';

import {
  CardElementOptions,
  CardElementProps,
} from 'src/components/cards/common';

type VendorProfileItemCardProps = CardElementProps & {
  profileId: ProfileId;
};

export default function VendorProfileItemCard(
  props: VendorProfileItemCardProps,
) {
  const { profileId, ...cardElementProps } = props;
  const profileData = useProfile(profileId);
  const isMyProfile = useIsMyProfile(profileId);

  return (
    <AsyncGate
      data={profileData}
      onPending={() => (
        <LoadedVendorProfileItemCard.Pending {...cardElementProps} />
      )}
      onFulfilled={profile => {
        if (!profile) return null;

        if (profile.kind !== 'vendor') {
          console.warn(
            '[VendorProfileItemCard] Received a non-vendor profile object with',
            `ID '${profile.id}' of kind '${profile.kind}', which is`,
            'unexpected. Continuing on...',
          );
        }

        return (
          <LoadedVendorProfileItemCard
            vendorProfile={profile as VendorProfile}
            isMyProfile={isMyProfile}
            {...cardElementProps}
          />
        );
      }}
    />
  );
}

type LoadedVendorProfileItemCardProps = CardElementProps & {
  vendorProfile: VendorProfile;
  isMyProfile: boolean;
};

const LoadedVendorProfileItemCard = (
  props: LoadedVendorProfileItemCardProps,
) => {
  const { vendorProfile, isMyProfile, ...cardElementProps } = props;

  const navigation = useNavigation<RootStackNavigationProp>();

  const renderCardBody = React.useCallback(
    (elementOptions: CardElementOptions) => {
      let background: MediaSource | undefined = undefined;

      if (vendorProfile.background) {
        if (
          vendorProfile.background.mime.includes('video') &&
          vendorProfile.backgroundThumbnail
        ) {
          background = vendorProfile.backgroundThumbnail;
        } else {
          background = vendorProfile.background;
        }
      }

      return (
        <View>
          <View>
            <Card.Indicator iconName="happy" position="top-right" />
            <FastImage
              source={
                background
                  ? { uri: background.url }
                  : constants.media.DEFAULT_IMAGE
              }
              style={{
                width: '100%',
                aspectRatio: 1,
                backgroundColor: constants.color.placeholder,
              }}
            />
          </View>
          <View
            style={{
              paddingHorizontal: elementOptions.insetHorizontal,
              paddingVertical: elementOptions.insetVertical,
            }}>
            <Text
              numberOfLines={elementOptions.smallContent ? 2 : 4}
              style={[
                elementOptions.captionTextStyle,
                !vendorProfile.biography && { fontStyle: 'italic' },
              ]}>
              {vendorProfile.biography ?? 'No biography'}
            </Text>
          </View>
        </View>
      );
    },
    [
      vendorProfile.biography,
      vendorProfile.background,
      vendorProfile.backgroundThumbnail,
    ],
  );

  const handlePressBody = () => {
    navigation.navigate('ProfileDetails', {
      profileId: vendorProfile.profileId,
      profileDisplayName:
        vendorProfile.businessEmail || vendorProfile.displayName,
    });
  };

  return (
    <Card {...cardElementProps}>
      <Card.Body onPress={handlePressBody}>{renderCardBody}</Card.Body>
      <Card.Footer>
        <Card.Author
          avatar={vendorProfile.avatar}
          displayName={vendorProfile.businessName || vendorProfile.displayName}
          isMyProfile={isMyProfile}
          onPress={handlePressBody}
        />
        <Card.Actions>
          <Card.HeartIconButton
            didLike={vendorProfile.statistics?.didLike ?? false}
            totalLikes={vendorProfile.statistics?.totalLikes ?? 0}
            onToggleLike={() => {}}
          />
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
};

LoadedVendorProfileItemCard.Pending = (props: CardElementProps) => {
  return (
    <Card {...props}>
      <Card.Body>{/* TODO: Add placeholder... */}</Card.Body>
      <Card.Footer {...props}>
        <Card.Author.Pending />
        <Card.Actions.Pending />
      </Card.Footer>
    </Card>
  );
};
