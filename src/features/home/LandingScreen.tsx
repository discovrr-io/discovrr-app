import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  LogBox,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

import analytics from '@react-native-firebase/analytics';
import messaging from '@react-native-firebase/messaging';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import Parse from 'parse/react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as onboardingSlice from 'src/features/onboarding/onboarding-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import ProductItemCard from 'src/features/products/ProductItemCard';
import { ProductId, Profile } from 'src/models';
import { HomeStackScreenProps, RootStackNavigationProp } from 'src/navigation';

import {
  Button,
  EmptyContainer,
  LoadingContainer,
  MasonryList,
  Spacer,
} from 'src/components';

import {
  useAppDispatch,
  useAppSelector,
  useExtendedTheme,
  useIsMounted,
} from 'src/hooks';

import OnboardingModal, {
  OnboardingModalContext,
  OnboardingResult,
} from 'src/features/onboarding/OnboardingModal';

const TILE_SPACING = constants.values.DEFAULT_TILE_SPACING;
const EXPLORE_OUR_MAKERS_NUM_COLUMNS = 2;

const MAKER_OF_THE_WEEK_TITLE = 'Maker of the week';
const OUR_PICKS_FOR_THE_WEEK_TITLE = 'Our picks for the week';
const LIMITED_OFFER_TITLE = 'Limited offer';
const EXPLORE_OUR_MAKERS_TITLE = 'Explore our makers';

type HomeFeedData = {
  callToAction: {
    title: string;
    caption: string;
  };
  makerOfTheWeek: {
    title: string;
    caption: string;
    coverImageUrl?: string;
    link?: string;
    linkTitle?: string;
  };
  featuredProductIds?: ProductId[];
  limitedOfferProductId?: ProductId;
};

async function requestNotificationPermission() {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    // TODO: Do something useful with this (e.g applying notification
    // settings)
    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  } catch (error) {
    console.error('Failed to request permission', error);
  }
}

async function fetchHomeFeedData(): Promise<HomeFeedData> {
  const homeFeedQuery = new Parse.Query(Parse.Object.extend('HomeFeed'));
  homeFeedQuery.descending('createdAt').equalTo('active', true);

  const homeFeedData = await homeFeedQuery.first();
  if (!homeFeedData)
    throw new Error('No home feed data found, which is unexpected');

  const makersQuery = new Parse.Query(Parse.Object.extend('Profile'));
  makersQuery
    .include('profileVendor')
    .equalTo('kind', 'vendor')
    .equalTo('highest-role', 'verified-vendor');

  return {
    callToAction: {
      title: homeFeedData.get('callToActionTitle'),
      caption: homeFeedData.get('callToActionCaption'),
    },
    makerOfTheWeek: {
      title: homeFeedData.get('makerOfTheWeekTitle'),
      caption: homeFeedData.get('makerOfTheWeekCaption'),
      coverImageUrl: homeFeedData.get('makerOfTheWeekCoverImageUrl'),
      link: homeFeedData.get('makerOfTheWeekLink'),
      linkTitle: homeFeedData.get('makerOfTheWeekLinkTitle'),
    },
    featuredProductIds: homeFeedData.get('featuredProductsArray'),
    limitedOfferProductId: homeFeedData.get('limitedOfferProduct')?.id,
  };
}

type SectionTitleProps = {
  title: string;
  style?: StyleProp<ViewStyle>;
};

function SectionTitle(props: SectionTitleProps) {
  const { colors } = useExtendedTheme();
  return (
    <View style={[sectionTitleProps.container, props.style]}>
      <Text
        allowFontScaling={false}
        style={[
          constants.font.h2,
          sectionTitleProps.title,
          { color: colors.text },
        ]}>
        {props.title}
      </Text>
    </View>
  );
}

const sectionTitleProps = StyleSheet.create({
  container: {
    paddingVertical: constants.layout.spacing.xxl,
  },
  title: {
    textAlign: 'center',
    fontSize: constants.font.size.h2 * 0.8,
  },
});

function SignInCard() {
  const navigation = useNavigation<RootStackNavigationProp>();

  const handlePressSignIn = () => {
    navigation.navigate('AuthPrompt', { screen: 'AuthStart' });
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePressSignIn}
      style={[landingScreenStyles.card, signInCardStyles.card]}>
      <Text
        style={[
          constants.font.mediumBold,
          { flex: 1, color: constants.color.absoluteWhite },
        ]}>
        Discovrr is better when you&apos;re signed in.
      </Text>
      <Spacer.Horizontal value="md" />
      <Button
        title="Sign In"
        variant="contained"
        size="medium"
        overrideTheme="light-content"
        onPress={handlePressSignIn}
        containerStyle={{ backgroundColor: constants.color.absoluteWhite }}
      />
    </TouchableOpacity>
  );
}

const signInCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: constants.color.gray700,
  },
});

type CallToActionCardProps = HomeFeedData['callToAction'];

function CallToActionCard(props: CallToActionCardProps) {
  return (
    <View style={[landingScreenStyles.card, callToActionCardStyles.card]}>
      <Text
        allowFontScaling={false}
        style={[
          constants.font.h2,
          { color: constants.color.absoluteWhite },
          { textAlign: 'center' },
        ]}>
        {props.title}
      </Text>
      <Spacer.Vertical value="md" />
      <Text
        allowFontScaling={false}
        style={[
          constants.font.large,
          { color: constants.color.absoluteWhite },
          { textAlign: 'center' },
        ]}>
        {props.caption}
      </Text>
      {false && <ScrollUpText />}
    </View>
  );
}

function ScrollUpText() {
  const translateState = useSharedValue(0);

  const translateStyles = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(translateState.value, [0, 1], [0, -5]),
      },
    ],
  }));

  React.useEffect(() => {
    translateState.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true,
    );
  }, [translateState]);

  return (
    <Animated.View
      style={[callToActionCardStyles.scrollDownContainer, translateStyles]}>
      <Icon name="arrow-up" size={16} color={constants.color.absoluteWhite} />
      <Text
        style={[
          constants.font.smallBold,
          callToActionCardStyles.scrollDownText,
          { marginHorizontal: constants.layout.spacing.sm },
        ]}>
        Scroll up to find out more
      </Text>
      <Icon name="arrow-up" size={16} color={constants.color.absoluteWhite} />
    </Animated.View>
  );
}

const callToActionCardStyles = StyleSheet.create({
  card: {
    minHeight: 280,
    backgroundColor: constants.color.blue700,
  },
  scrollDownContainer: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: constants.layout.spacing.lg,
  },
  scrollDownText: {
    color: constants.color.absoluteWhite,
  },
});

function ShopNowCard() {
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleGoToNearMe = () => {
    navigation.navigate('Main', {
      screen: 'Facade',
      params: {
        screen: 'Explore',
        params: { screen: 'Feed', params: { screen: 'NearMeFeed' } },
      },
    });
  };

  return (
    <TouchableHighlight
      underlayColor={constants.color.teal300}
      onPress={handleGoToNearMe}
      style={[landingScreenStyles.card, shopNowCardStyle.card]}>
      <View style={{ alignItems: 'center' }}>
        <Text
          allowFontScaling={false}
          style={[
            constants.font.h2,
            {
              color: constants.color.absoluteWhite,
              fontSize: constants.font.size.h2 * 0.8,
            },
          ]}>
          Shop Now
        </Text>
        <Text
          style={[
            constants.font.mediumBold,
            { color: constants.color.absoluteWhite },
          ]}>
          Tap here to browse our products
        </Text>
      </View>
    </TouchableHighlight>
  );
}

const shopNowCardStyle = StyleSheet.create({
  card: { minHeight: 190, backgroundColor: constants.color.teal500 },
});

type MakerOfTheWeekProps = HomeFeedData['makerOfTheWeek'];

function MakerOfTheWeek(props: MakerOfTheWeekProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const { colors } = useExtendedTheme();
  const navigation = useNavigation<RootStackNavigationProp>();

  const handlePressCard = () => {
    if (props.link) {
      navigation.navigate('InAppWebView', {
        destination: { uri: props.link },
        title: props.linkTitle || 'Maker of the Week',
      });
    }
  };

  return (
    <View>
      <SectionTitle title={MAKER_OF_THE_WEEK_TITLE} />
      <TouchableOpacity activeOpacity={1} onPress={handlePressCard}>
        <View style={makerOfTheWeekStyles.coverImageContainer}>
          <FastImage
            resizeMode="cover"
            source={{ uri: props.coverImageUrl }}
            style={[
              makerOfTheWeekStyles.coverImage,
              { backgroundColor: colors.placeholder },
            ]}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
          />
          {isLoading && (
            <ActivityIndicator
              size="large"
              color={constants.color.gray500}
              style={{ position: 'absolute' }}
            />
          )}
        </View>
        <Spacer.Vertical value="md" />
        <View style={makerOfTheWeekStyles.textContainer}>
          <Text
            numberOfLines={1}
            style={[constants.font.mediumBold, { color: colors.text }]}>
            {props.title}
          </Text>
          <Spacer.Vertical value="sm" />
          <Text
            numberOfLines={3}
            style={[constants.font.small, { color: colors.text }]}>
            {props.caption}
          </Text>
        </View>
      </TouchableOpacity>
      <Spacer.Vertical value="sm" />
      <TouchableOpacity
        activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
        onPress={handlePressCard}>
        <Text
          style={[
            makerOfTheWeekStyles.textContainer,
            constants.font.smallBold,
            { color: constants.color.accent },
          ]}>
          Read more…
        </Text>
      </TouchableOpacity>
    </View>
  );
}

MakerOfTheWeek.Pending = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useExtendedTheme();
  return (
    <View>
      <SectionTitle title={MAKER_OF_THE_WEEK_TITLE} />
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <FastImage
          source={{}}
          style={[
            makerOfTheWeekStyles.coverImage,
            { backgroundColor: colors.placeholder },
          ]}
        />
        <ActivityIndicator
          size="large"
          color={constants.color.gray500}
          style={{ position: 'absolute' }}
        />
      </View>
      <Spacer.Vertical value="md" />
      <View style={makerOfTheWeekStyles.textContainer}>
        <View style={{ height: 19, backgroundColor: colors.placeholder }} />
        <Spacer.Vertical value="sm" />
        <View style={{ height: 17, backgroundColor: colors.placeholder }} />
      </View>
    </View>
  );
};

const makerOfTheWeekStyles = StyleSheet.create({
  coverImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    height: 280,
    width: '100%',
    borderRadius: constants.layout.radius.md,
  },
  textContainer: {
    paddingHorizontal: constants.layout.spacing.md,
  },
});

type LimitedOfferProps = {
  productId: NonNullable<HomeFeedData['limitedOfferProductId']>;
};

function LimitedOffer(props: LimitedOfferProps) {
  return (
    <View>
      <SectionTitle title={LIMITED_OFFER_TITLE} />
      <ProductItemCard productId={props.productId} />
    </View>
  );
}

type ExploreOurMakersProps = {
  profiles: Profile[];
};

function ExploreOurMakers(props: ExploreOurMakersProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useExtendedTheme();

  const { columnWidth, avatarWidth } = React.useMemo(() => {
    const containerWidth = windowWidth - constants.layout.spacing.md * 2;
    const columnWidth = containerWidth / EXPLORE_OUR_MAKERS_NUM_COLUMNS;
    const avatarWidth = columnWidth * 0.7;
    return { containerWidth, columnWidth, avatarWidth };
  }, [windowWidth]);

  const navigation = useNavigation<RootStackNavigationProp>();

  const handlePressMaker = (profile: Profile) => {
    navigation.navigate('ProfileDetails', {
      profileIdOrUsername: profile.profileId,
    });
  };

  return (
    <FlatList
      data={props.profiles}
      numColumns={EXPLORE_OUR_MAKERS_NUM_COLUMNS}
      keyExtractor={profile => String(profile.id)}
      ListHeaderComponent={<SectionTitle title={EXPLORE_OUR_MAKERS_TITLE} />}
      renderItem={({ item: profile, index }) => (
        <TouchableOpacity
          activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
          onPress={() => handlePressMaker(profile)}
          style={[
            exploreOurMakersStyles.itemContainer,
            {
              width: columnWidth,
              paddingBottom:
                index <
                props.profiles.length - 1 - EXPLORE_OUR_MAKERS_NUM_COLUMNS
                  ? constants.layout.spacing.lg
                  : 0,
            },
          ]}>
          <FastImage
            source={
              profile.avatar
                ? { uri: profile.avatar.url }
                : constants.media.DEFAULT_AVATAR
            }
            style={[
              exploreOurMakersStyles.avatar,
              {
                width: avatarWidth,
                borderRadius: avatarWidth / 2,
                backgroundColor: colors.placeholder,
              },
            ]}
          />
          <Spacer.Vertical value="md" />
          <Text
            numberOfLines={1}
            style={[
              constants.font.mediumBold,
              { textAlign: 'center', color: colors.text },
            ]}>
            {profile.__publicName}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              constants.font.extraSmall,
              { textAlign: 'center', color: colors.text },
              !profile.biography && { fontStyle: 'italic' },
            ]}>
            {profile.biography || 'No biography'}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const exploreOurMakersStyles = StyleSheet.create({
  itemContainer: {
    alignItems: 'center',
    paddingHorizontal: constants.layout.spacing.sm,
  },
  avatar: {
    aspectRatio: 1,
  },
});

type LandingScreenProps = HomeStackScreenProps<'Landing'>;

export default function LandingScreen(_: LandingScreenProps) {
  const $FUNC = '[LandingScreen]';
  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const currentUser = useAppSelector(state => state.auth.user);

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const { isOutdatedModalVisible } = useAppSelector(state => state.auth);
  const shouldShowModal = useAppSelector(state => {
    return !state.onboarding.didCompleteMainOnboarding;
  });

  const [homeFeedData, setHomeFeedData] = React.useState<HomeFeedData>();
  const [makers, setMakers] = React.useState<Profile[]>([]);
  const [isInitialRender, setIsInitialRender] = React.useState(true);
  const [shouldRefresh, setShouldRefresh] = React.useState(false);

  const masonryListScrollViewRef = React.useRef<ScrollView>(null);
  useScrollToTop(masonryListScrollViewRef);

  // Firebase does not log screen view when the first screen the user jumps into
  // is the landing page, so we'll manually log it here.
  // NOTE: This will log this screen twice if the user starts from the Auth
  // screen and then navigates to the Landing screen.
  React.useEffect(() => {
    // Temporarily disable error from VirtualizedLists
    LogBox.ignoreLogs(['VirtualizedLists']);

    analytics()
      .logScreenView({
        screen_name: 'Landing',
        screen_class: 'Landing',
      })
      .catch(error => console.warn($FUNC, 'Failed to log screen view:', error));
  }, []);

  React.useEffect(() => {
    if (!shouldShowModal) return;

    const timeout = setTimeout(() => {
      setIsModalVisible(true);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [shouldShowModal]);

  React.useEffect(
    () => {
      if (isInitialRender || shouldRefresh)
        (async () => {
          try {
            console.log($FUNC, 'Fetching home feed data...');
            const homeFeedData = await fetchHomeFeedData();
            const makers = await dispatch(
              profilesSlice.fetchAllVerifiedVendors(),
            ).unwrap();
            setHomeFeedData(homeFeedData);
            setMakers(makers);
            console.log($FUNC, 'Successfully fetched home feed data');
          } catch (error) {
            console.error($FUNC, 'Failed to load home feed data:', error);
            utilities.alertSomethingWentWrong();
          } finally {
            if (isMounted.current) {
              if (isInitialRender) setIsInitialRender(false);
              if (shouldRefresh) setShouldRefresh(false);
            }
          }
        })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, isInitialRender, shouldRefresh],
  );

  const handleRefresh = () => {
    if (!isInitialRender && !shouldRefresh) setShouldRefresh(true);
  };

  const handleCompleteOnboarding = async (result: OnboardingResult) => {
    try {
      console.log($FUNC, 'Sending onboarding result:', result);

      const survey = await new Parse.Query('Survey')
        .equalTo('response', result.surveyResponse || 'no answer')
        .first();

      survey?.increment('count');
      await survey?.save();

      dispatch(onboardingSlice.completeMainOnboarding());
    } catch (error) {
      // We don't care if it fails
      console.warn($FUNC, 'Failed to save onboarding response:', error);
    } finally {
      setIsModalVisible(false);
      await requestNotificationPermission();
    }
  };

  const handleSkipOnboarding = async () => {
    console.log($FUNC, 'Skipped onboarding');
    setIsModalVisible(false);
    await requestNotificationPermission();
  };

  return (
    <OnboardingModalContext.Provider
      value={{
        completeOnboarding: handleCompleteOnboarding,
        skipOnboarding: handleSkipOnboarding,
      }}>
      <OnboardingModal visible={!isOutdatedModalVisible && isModalVisible} />
      <MasonryList
        ref={masonryListScrollViewRef}
        data={homeFeedData?.featuredProductIds ?? []}
        contentContainerStyle={{
          paddingVertical: constants.layout.spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            tintColor={constants.color.gray500}
            refreshing={!isInitialRender && shouldRefresh}
            onRefresh={handleRefresh}
          />
        }
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal:
                constants.layout.defaultScreenMargins.horizontal,
            }}>
            {!currentUser && (
              <View>
                <SignInCard />
                <Spacer.Vertical value="lg" />
              </View>
            )}
            <CallToActionCard
              title={
                homeFeedData?.callToAction.title ??
                'Get inspired by Australian creativity today!'
              }
              caption={
                homeFeedData?.callToAction.caption ??
                'Explore our carefully curated catalogue of products made by our local makers.'
              }
            />
            <Spacer.Vertical value="lg" />
            <ShopNowCard />
            {(isInitialRender || shouldRefresh) && !homeFeedData ? (
              <MakerOfTheWeek.Pending />
            ) : homeFeedData ? (
              <MakerOfTheWeek {...homeFeedData.makerOfTheWeek} />
            ) : null}
            <SectionTitle title={OUR_PICKS_FOR_THE_WEEK_TITLE} />
          </View>
        }
        ListFooterComponent={
          <View
            style={{
              paddingBottom: constants.layout.defaultScreenMargins.vertical,
              paddingHorizontal:
                constants.layout.defaultScreenMargins.horizontal,
            }}>
            {homeFeedData?.limitedOfferProductId && (
              <LimitedOffer productId={homeFeedData.limitedOfferProductId} />
            )}
            {__DEV__ && Platform.OS === 'ios'
              ? null
              : (!isInitialRender || !shouldRefresh) &&
                makers.length > 0 && <ExploreOurMakers profiles={makers} />}
          </View>
        }
        ListEmptyComponent={
          isInitialRender || shouldRefresh ? (
            <LoadingContainer />
          ) : (
            <EmptyContainer message="There aren't any featured products at the moment" />
          )
        }
        renderItem={({ item: productId, column, index }) => (
          <ProductItemCard
            key={productId}
            productId={productId}
            elementOptions={{ smallContent: true }}
            style={{
              marginTop: index < 2 ? 0 : TILE_SPACING,
              marginLeft: column % 2 === 0 ? TILE_SPACING : TILE_SPACING / 2,
              marginRight: column % 2 !== 0 ? TILE_SPACING : TILE_SPACING / 2,
            }}
          />
        )}
      />
    </OnboardingModalContext.Provider>
  );
}

const landingScreenStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: constants.layout.spacing.lg,
    borderRadius: constants.layout.radius.md,
    overflow: 'hidden',
  },
});
