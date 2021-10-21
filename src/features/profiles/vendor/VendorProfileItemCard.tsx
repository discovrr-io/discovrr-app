import React, { useCallback } from 'react';
import { Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/core';

import { color } from 'src/constants';
import { AsyncGate, Card } from 'src/components';
import {
  CardElementOptions,
  CardElementProps,
} from 'src/components/cards/common';
import { useProfile } from 'src/features/profiles/hooks';
import { ProfileId, VendorProfile } from 'src/models';
import { RootStackNavigationProp } from 'src/navigation';
import { alertUnavailableFeature } from 'src/utilities';

type VendorProfileItemCardProps = CardElementProps & {
  profileId: ProfileId;
};

export default function VendorProfileItemCard(
  props: VendorProfileItemCardProps,
) {
  const { profileId, ...cardElementProps } = props;
  const profileData = useProfile(profileId);

  return (
    <AsyncGate
      data={profileData}
      onPending={() => (
        <InnerVendorProfileItemCard.Pending {...cardElementProps} />
      )}
      onFulfilled={profile => {
        if (!profile) return null;
        if (profile.kind !== 'vendor')
          console.warn(
            '[VendorProfileItemCard] Received a non-vendor profile object with',
            `ID '${profile.id}' of kind '${profile.kind}', which is unexpected.`,
            'Continuing on...',
          );
        return (
          <InnerVendorProfileItemCard
            vendorProfile={profile as VendorProfile}
            {...cardElementProps}
          />
        );
      }}
    />
  );
}

type InnerVendorProfileItemCardProps = CardElementProps & {
  vendorProfile: VendorProfile;
};

const InnerVendorProfileItemCard = (props: InnerVendorProfileItemCardProps) => {
  const { vendorProfile, ...cardElementProps } = props;

  const navigation = useNavigation<RootStackNavigationProp>();

  const renderCardBody = useCallback(
    (elementOptions: CardElementOptions) => {
      const coverPhoto = vendorProfile.coverPhoto;
      const { width = 1, height = 1 } = coverPhoto ?? {};
      const aspectRatio = width / height; // Defaults to square (1 / 1 = 1)

      return (
        <View>
          <View>
            <Card.Indicator iconName="cart" position="top-right" />
            <FastImage
              source={{ uri: coverPhoto?.url }}
              style={{
                aspectRatio,
                width: '100%',
                backgroundColor: color.placeholder,
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
    [vendorProfile.biography, vendorProfile.coverPhoto],
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
          onPress={handlePressBody}
        />
        <Card.Actions>
          <Card.HeartIconButton
            didLike={false}
            totalLikes={0}
            onToggleLike={() => alertUnavailableFeature()}
          />
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
};

InnerVendorProfileItemCard.Pending = (props: CardElementProps) => {
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
