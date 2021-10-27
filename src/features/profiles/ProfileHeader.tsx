import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import Profile, { VendorProfileAddress } from 'src/models/profile';
import { color, font, layout } from 'src/constants';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';
import { shortenLargeNumber } from 'src/utilities';

const DEFAULT_BACKGROUND = require('../../../assets/images/backdrop.png');

export const HEADER_MAX_HEIGHT = 265;
const AVATAR_IMAGE_RADIUS = 80;

type ProfileDetails = Pick<
  Profile,
  'username' | 'avatar' | 'coverPhoto' | 'biography'
> & {
  displayName: string;
  username?: string | undefined;
  address?: VendorProfileAddress;
};

type RenderProfileDetailsChildren = (
  profileDetails: ProfileDetails,
) => React.ReactNode;

export type ProfileHeaderProps = {
  profileDetails: ProfileDetails;
  renderStatistics?: RenderProfileDetailsChildren;
  renderActions?: RenderProfileDetailsChildren;
};

export default function ProfileHeader(props: ProfileHeaderProps) {
  const { profileDetails, renderStatistics, renderActions } = props;
  const { width: windowWidth } = useWindowDimensions();

  return (
    <View pointerEvents="box-none">
      <FastImage
        resizeMode="cover"
        source={
          profileDetails.coverPhoto
            ? { uri: profileDetails.coverPhoto.url }
            : DEFAULT_BACKGROUND
        }
        style={{
          width: windowWidth,
          height: HEADER_MAX_HEIGHT,
          backgroundColor: color.gray100,
        }}
      />
      <View style={profileHeaderStyles.contentContainer}>
        <View style={profileHeaderStyles.innerContentContainer}>
          <FastImage
            source={
              profileDetails.avatar
                ? { uri: profileDetails.avatar.url }
                : DEFAULT_AVATAR
            }
            style={{
              width: AVATAR_IMAGE_RADIUS,
              height: AVATAR_IMAGE_RADIUS,
              borderRadius: AVATAR_IMAGE_RADIUS / 2,
              backgroundColor: color.gray100,
            }}
          />
          <View style={{ flexGrow: 1, justifyContent: 'space-around' }}>
            {renderStatistics && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-evenly',
                }}>
                {renderStatistics(profileDetails)}
              </View>
            )}
            {renderActions && (
              <View
                style={{
                  flexDirection: 'row',
                  paddingLeft: layout.spacing.md,
                }}>
                {renderActions(profileDetails)}
              </View>
            )}
          </View>
        </View>
        <Text
          style={[
            font.extraLargeBold,
            profileHeaderStyles.contentContainerText,
            { color: color.white },
          ]}>
          {profileDetails.displayName || 'Anonymous'}
        </Text>
        {profileDetails.username ? (
          <Text
            style={[
              font.small,
              profileHeaderStyles.contentContainerText,
              { color: color.white },
            ]}>
            @{profileDetails.username || 'anonymous'}
          </Text>
        ) : null}
        <Text style={[font.small, { color: color.white }]}>
          {profileDetails.biography || 'No biography'}
        </Text>
      </View>
    </View>
  );
}

const profileHeaderStyles = StyleSheet.create({
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: layout.spacing.md * 1.25,
    backgroundColor: 'rgba(82, 82, 82, 0.8)',
  },
  contentContainerText: {
    marginBottom: layout.spacing.xs,
  },
  innerContentContainer: {
    flexDirection: 'row',
    marginBottom: layout.spacing.md,
  },
});

type ProfileHeaderStatisticProps = {
  label: string;
  count: number;
  onPress?: () => void;
};

function ProfileHeaderStatistic(props: ProfileHeaderStatisticProps) {
  const { label, count, onPress } = props;

  return (
    <TouchableOpacity
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      style={profileHeaderStatisticStyles.container}
      onPress={onPress}>
      <Text numberOfLines={1} style={profileHeaderStatisticStyles.label}>
        {label}
      </Text>
      <Text numberOfLines={1} style={profileHeaderStatisticStyles.count}>
        {shortenLargeNumber(count)}
      </Text>
    </TouchableOpacity>
  );
}

const profileHeaderStatisticStyles = StyleSheet.create({
  container: {
    width: 80,
  },
  label: {
    ...font.small,
    textAlign: 'center',
    color: color.white,
  },
  count: {
    ...font.extraLargeBold,
    textAlign: 'center',
    color: color.white,
  },
});

ProfileHeader.Statistic = ProfileHeaderStatistic;
