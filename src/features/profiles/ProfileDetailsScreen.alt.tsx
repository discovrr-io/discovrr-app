import * as React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

// import Animated from 'react-native-reanimated';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import __ProfileHeader from './ProfileHeader';
import { Profile } from 'src/models';
import { RootStackScreenProps } from 'src/navigation';
import {
  AsyncGate,
  LoadingContainer,
  RouteError,
  Spacer,
  ToggleButton,
} from 'src/components';

import { useProfile } from './hooks';

type ProfileDetailsScreenProps = RootStackScreenProps<'ProfileDetails'>;

export default function ProfileDetailsScreen(props: ProfileDetailsScreenProps) {
  const profileData = useProfile(props.route.params.profileId);
  const headerHeight = useHeaderHeight();

  const renderRouteError = (_error?: any) => (
    <RouteError containerStyle={{ backgroundColor: constants.color.white }} />
  );

  return (
    <AsyncGate
      data={profileData}
      onPending={() => (
        <SafeAreaView
          style={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: headerHeight,
          }}>
          <LoadingContainer message="Loading profile..." />
        </SafeAreaView>
      )}
      onFulfilled={profile => {
        if (!profile) return renderRouteError();
        return <LoadedProfileDetailsScreen profile={profile} {...props} />;
      }}
      onRejected={renderRouteError}
    />
  );
}

type LoadedProfileDetailsScreenProps = ProfileDetailsScreenProps & {
  profile: Profile;
};

function LoadedProfileDetailsScreen(props: LoadedProfileDetailsScreenProps) {
  const { profile, navigation } = props;
  const { height: windowHeight } = useWindowDimensions();

  const headerHeight = useHeaderHeight();
  // const headerTitleOpacity = React.useRef(new Animated.Value(0)).current;

  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(
    () => [windowHeight * 0.45, windowHeight - headerHeight],
    [headerHeight, windowHeight],
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      // headerTitleContainerStyle: {
      //   opacity: headerTitleOpacity.interpolate({
      //     inputRange: [0, 1],
      //     outputRange: [0, 1],
      //   }),
      // },
      headerRight: ({ tintColor }) => (
        <TouchableOpacity
          activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
          // onPress={() => actionBottomSheetRef.current?.expand()}
          onPress={() => {}}
          style={{
            marginRight: constants.layout.defaultScreenMargins.horizontal,
          }}>
          <Icon
            name={Platform.select({
              android: 'ellipsis-vertical',
              default: 'ellipsis-horizontal',
            })}
            size={24}
            color={tintColor || constants.color.black}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
      <StatusBar
        animated
        translucent
        barStyle="light-content"
        backgroundColor="transparent"
      />
      <ProfileDetailsHeader profile={profile} />
      <LinearGradient
        colors={[
          constants.color.absoluteBlack + 'A0', // alpha channel
          constants.color.absoluteBlack + '00', // alpha channel
        ]}
        style={{
          position: 'absolute',
          width: '100%',
          height: headerHeight * 1.25,
        }}
      />
      <BottomSheet
        ref={bottomSheetRef}
        animateOnMount={false}
        onChange={index => console.log('CHANGE:', index)}
        onAnimate={(from, to) => console.log('ANIMATE:', { from, to })}
        snapPoints={snapPoints}>
        <BottomSheetScrollView>
          <Text>{JSON.stringify(profile)}</Text>
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

type ProfileDetailsHeaderPros = {
  profile: Profile;
};

function ProfileDetailsHeader(props: ProfileDetailsHeaderPros) {
  const { profile } = props;
  const { height: windowHeight } = useWindowDimensions();

  const headerHeight = useHeaderHeight();
  const avatarHeight = windowHeight * 0.13;

  return (
    <View style={profileDetailsHeaderStyles.headerContainer}>
      <FastImage
        resizeMode="cover"
        source={
          profile.coverPhoto
            ? { uri: profile.coverPhoto.url }
            : constants.media.DEFAULT_IMAGE
        }
        style={profileDetailsHeaderStyles.coverPhoto}
      />
      <View
        style={[
          profileDetailsHeaderStyles.headerInsetContainer,
          { paddingTop: headerHeight / 2 },
        ]}>
        <View style={profileDetailsHeaderStyles.headerContentContainer}>
          <View style={profileDetailsHeaderStyles.headerTextContainer}>
            <FastImage
              source={
                profile.avatar
                  ? { uri: profile.avatar.url }
                  : constants.media.DEFAULT_AVATAR
              }
              style={[
                profileDetailsHeaderStyles.avatar,
                { height: avatarHeight, borderRadius: avatarHeight / 2 },
              ]}
            />
            <Text
              style={[
                constants.font.extraLargeBold,
                profileDetailsHeaderStyles.headerText,
                { fontSize: constants.font.size.h3 },
              ]}>
              {profile.displayName}
            </Text>
            <Text
              style={[
                constants.font.mediumBold,
                profileDetailsHeaderStyles.headerText,
              ]}>
              @{profile.username}
            </Text>
            {profile.biography && (
              <Text
                numberOfLines={2}
                style={[
                  constants.font.small,
                  profileDetailsHeaderStyles.headerText,
                ]}>
                {profile.biography}
              </Text>
            )}
          </View>
          <Spacer.Vertical value="md" />
          <View style={profileDetailsHeaderStyles.headerStatisticsContainer}>
            <ProfileDetailsHeaderStatistics label="Followers" count={4321} />
            <ProfileDetailsHeaderStatistics label="Following" count={1234} />
            <ProfileDetailsHeaderStatistics label="Likes" count={9876} />
          </View>
          <Spacer.Vertical value="md" />
          <ToggleButton
            size="medium"
            title={isToggled => (isToggled ? 'Following' : 'Follow')}
            initialState={false}
            underlayColor={isToggled =>
              isToggled
                ? constants.color.accentFocused
                : constants.color.gray200
            }
            textStyle={isToggled => [
              isToggled && { color: constants.color.defaultLightTextColor },
            ]}
            containerStyle={isToggled => [
              {
                width: '75%',
                borderWidth: 0,
                backgroundColor: isToggled
                  ? constants.color.accent
                  : constants.color.gray100,
              },
            ]}
            onPress={() => {}}
          />
        </View>
      </View>
    </View>
  );
}

const profileDetailsHeaderStyles = StyleSheet.create({
  avatar: {
    aspectRatio: 1,
    backgroundColor: constants.color.placeholder,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: constants.color.placeholder,
  },
  headerContainer: {
    width: '100%',
    height: '55%',
  },
  headerInsetContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'center',
    paddingHorizontal: constants.layout.spacing.lg,
    backgroundColor: constants.color.absoluteBlack + '80',
  },
  headerContentContainer: {
    alignItems: 'center',
    paddingHorizontal: constants.layout.spacing.lg,
  },
  headerTextContainer: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
  },
  headerText: {
    textAlign: 'center',
    color: constants.color.defaultLightTextColor,
  },
  headerStatisticsContainer: {
    flexDirection: 'row',
  },
});

type ProfileDetailsHeaderStatisticProps = {
  label: string;
  count: number;
  onPress?: () => void;
};

function ProfileDetailsHeaderStatistics(
  props: ProfileDetailsHeaderStatisticProps,
) {
  const { label, count, onPress } = props;
  return (
    <TouchableOpacity
      activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
      style={profileDetailsHeaderStatisticStyles.container}
      onPress={onPress}>
      <Text numberOfLines={1} style={profileDetailsHeaderStatisticStyles.label}>
        {label}
      </Text>
      <Text numberOfLines={1} style={profileDetailsHeaderStatisticStyles.count}>
        {utilities.shortenLargeNumber(count)}
      </Text>
    </TouchableOpacity>
  );
}

const profileDetailsHeaderStatisticStyles = StyleSheet.create({
  container: {
    width: 80,
  },
  label: {
    ...constants.font.small,
    textAlign: 'center',
    color: constants.color.white,
  },
  count: {
    ...constants.font.extraLargeBold,
    textAlign: 'center',
    color: constants.color.white,
  },
});
