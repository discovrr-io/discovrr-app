import * as React from 'react';
import {
  Platform,
  StatusBar,
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
      <ProfileHeader profile={profile} />
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

function ProfileHeader(props: { profile: Profile }) {
  const { profile } = props;
  const { height: windowHeight } = useWindowDimensions();

  const headerHeight = useHeaderHeight();
  const avatarHeight = windowHeight * 0.13;

  return (
    <View style={{ width: '100%', height: '55%' }}>
      <FastImage
        resizeMode="cover"
        source={
          profile.coverPhoto
            ? { uri: profile.coverPhoto.url }
            : constants.media.DEFAULT_IMAGE
        }
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: constants.color.placeholder,
        }}
      />
      <View
        style={[
          {
            width: '100%',
            height: '100%',
            position: 'absolute',
            paddingTop: headerHeight / 2,
            justifyContent: 'center',
            paddingHorizontal: constants.layout.spacing.lg,
            backgroundColor: constants.color.absoluteBlack + '80',
          },
        ]}>
        <View
          style={{
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              alignItems: 'center',
            }}>
            <View
              style={{
                alignItems: 'center',
                paddingHorizontal: constants.layout.spacing.lg,
              }}>
              <FastImage
                source={
                  profile.avatar
                    ? { uri: profile.avatar.url }
                    : constants.media.DEFAULT_AVATAR
                }
                style={{
                  backgroundColor: constants.color.placeholder,
                  aspectRatio: 1,
                  width: avatarHeight,
                  borderRadius: avatarHeight / 2,
                }}
              />
              <View
                style={{
                  flexShrink: 1,
                }}>
                <Text
                  style={[
                    constants.font.extraLargeBold,
                    { textAlign: 'center' },
                    {
                      fontSize: constants.font.size.h3,
                      color: constants.color.defaultLightTextColor,
                    },
                  ]}>
                  {profile.displayName}
                </Text>

                <Text
                  style={[
                    constants.font.mediumBold,
                    { textAlign: 'center' },
                    { color: constants.color.defaultLightTextColor },
                  ]}>
                  @{profile.username}
                </Text>
                {profile.biography && (
                  <>
                    <Spacer.Vertical value="xs" />
                    <Text
                      numberOfLines={2}
                      style={[
                        constants.font.small,
                        { textAlign: 'center' },
                        { color: constants.color.defaultLightTextColor },
                      ]}>
                      {profile.biography}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
          <Spacer.Vertical value="md" />
          <View>
            <View style={{ flexDirection: 'row' }}>
              <__ProfileHeader.Statistic label="Followers" count={4321} />
              <__ProfileHeader.Statistic label="Following" count={1234} />
              <__ProfileHeader.Statistic label="Likes" count={9876} />
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
    </View>
  );
}
