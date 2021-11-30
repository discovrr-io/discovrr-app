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
import Parse from 'parse/react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import ProductItemCard from 'src/features/products/ProductItemCard';
import { ProductId, Profile } from 'src/models';
import { HomeStackScreenProps, RootStackNavigationProp } from 'src/navigation';

import {
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

import * as onboardingSlice from 'src/features/onboarding/onboarding-slice';
import OnboardingModal, {
  OnboardingModalContext,
  OnboardingResult,
} from './OnboardingModal';

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

type CallToActionProps = HomeFeedData['callToAction'];

function CallToAction(props: CallToActionProps) {
  return (
    <View style={[callToActionStyles.container]}>
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
      {/* Scroll down to learn more... */}
    </View>
  );
}

const callToActionStyles = StyleSheet.create({
  container: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    padding: constants.layout.spacing.lg,
    // paddingBottom: constants.layout.spacing.xxl + constants.layout.spacing.sm,
    // justifyContent: 'flex-end',
    backgroundColor: constants.color.blue700,
    borderRadius: constants.layout.radius.md,
    overflow: 'hidden',
  },
  logo: {
    position: 'absolute',
    top: -70,
    right: -70,
    opacity: 0.15,
  },
});

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

  const navigation = useNavigation<LandingScreenProps['navigation']>();

  const handlePressMaker = (profile: Profile) => {
    navigation.getParent<RootStackNavigationProp>().navigate('ProfileDetails', {
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

export default function LandingScreen(props: LandingScreenProps) {
  const $FUNC = '[LandingScreen]';
  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const { isOutdatedModalVisible } = useAppSelector(state => state.auth);

  const [homeFeedData, setHomeFeedData] = React.useState<HomeFeedData>();
  const [makers, setMakers] = React.useState<Profile[]>([]);
  const [isInitialRender, setIsInitialRender] = React.useState(true);
  const [shouldRefresh, setShouldRefresh] = React.useState(false);

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const shouldShowModal = useAppSelector(state => {
    return !state.onboarding.didCompleteMainOnboarding;
  });

  const masonryListScrollViewRef = React.useRef<ScrollView>(null);
  useScrollToTop(masonryListScrollViewRef);

  React.useEffect(() => {
    if (!shouldShowModal) return;

    const timer = setTimeout(() => {
      setIsModalVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [shouldShowModal]);

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

  const handleGoToNearMe = () => {
    props.navigation.getParent<RootStackNavigationProp>().navigate('Main', {
      screen: 'Facade',
      params: {
        screen: 'Explore',
        params: { screen: 'Feed', params: { screen: 'NearMeFeed' } },
      },
    });
  };

  const handleConcludeOnboarding = async (result: OnboardingResult) => {
    setIsModalVisible(false);
    console.log($FUNC, 'Submitting onboarding response...');
    const submitResponseAction = onboardingSlice.submitOnboardingResponse({
      surveyResult: result.surveyResponse || 'no answer',
    });

    dispatch(submitResponseAction)
      .unwrap()
      .catch(error => {
        console.error($FUNC, 'Failed to submit onboarding result:', error);
      });

    console.log($FUNC, 'Requesting notification permission...');
    await requestNotificationPermission();
  };

  const handleSkipOnboarding = async () => {
    setIsModalVisible(false);
    console.log($FUNC, 'Requesting notification permission...');
    await requestNotificationPermission();
  };

  return (
    <OnboardingModalContext.Provider
      value={{
        completeOnboarding: handleConcludeOnboarding,
        skipOnboarding: handleSkipOnboarding,
      }}>
      <MasonryList
        ref={masonryListScrollViewRef}
        data={homeFeedData?.featuredProductIds ?? []}
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
              paddingTop: constants.layout.defaultScreenMargins.vertical,
              paddingHorizontal:
                constants.layout.defaultScreenMargins.horizontal,
            }}>
            <CallToAction
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
            <TouchableHighlight
              underlayColor={constants.color.teal300}
              onPress={handleGoToNearMe}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: constants.color.teal500,
                borderRadius: constants.layout.radius.md,
                minHeight: 190,
              }}>
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
      <OnboardingModal visible={!isOutdatedModalVisible && isModalVisible} />
    </OnboardingModalContext.Provider>
  );
}
