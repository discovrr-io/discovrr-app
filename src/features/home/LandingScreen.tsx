import * as React from 'react';
import {
  ActivityIndicator,
  // Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
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
import ProductItemCard from 'src/features/products/ProductItemCard';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { ProductId } from 'src/models';
import { HomeStackScreenProps, RootStackNavigationProp } from 'src/navigation';

import {
  // DiscovrrIcon,
  EmptyContainer,
  LoadingContainer,
  MasonryList,
  Spacer,
} from 'src/components';

import * as onboardingSlice from 'src/features/onboarding/onboarding-slice';
import OnboardingModal, {
  OnboardingModalContext,
  OnboardingResult,
} from './OnboardingModal';

const TILE_SPACING = constants.values.DEFAULT_TILE_SPACING;

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
      {/* FIXME: Try to get `DiscovrrIcon` to work on Android */}
      {/* {Platform.OS === 'ios' && (
        <DiscovrrIcon
          color={constants.color.absoluteWhite}
          size={275}
          style={callToActionStyles.logo}
        />
      )} */}
      <Text
        style={[
          constants.font.h2,
          { color: constants.color.absoluteWhite /* textAlign: 'center' */ },
        ]}>
        {props.title}
      </Text>
      <Spacer.Vertical value="md" />
      <Text
        style={[
          constants.font.large,
          { color: constants.color.absoluteWhite /* textAlign: 'center' */ },
        ]}>
        {props.caption}
      </Text>
    </View>
  );
}

const callToActionStyles = StyleSheet.create({
  container: {
    minHeight: 280,
    // alignItems: 'center',
    // justifyContent: 'center',
    padding: constants.layout.spacing.lg,
    paddingBottom: constants.layout.spacing.xxl + constants.layout.spacing.sm,
    justifyContent: 'flex-end',
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
  return (
    <View style={[sectionTitleProps.container, props.style]}>
      <Text style={[constants.font.h2, sectionTitleProps.title]}>
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
    // fontWeight: '600',
  },
});

type MakerOfTheWeekProps = HomeFeedData['makerOfTheWeek'];

function MakerOfTheWeek(props: MakerOfTheWeekProps) {
  const [isLoading, setIsLoading] = React.useState(false);
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
      <SectionTitle title="Maker of the week" />
      <TouchableOpacity activeOpacity={1} onPress={handlePressCard}>
        <View style={makerOfTheWeekStyles.coverImageContainer}>
          <FastImage
            resizeMode="cover"
            source={{ uri: props.coverImageUrl }}
            style={makerOfTheWeekStyles.coverImage}
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
          <Text numberOfLines={1} style={constants.font.mediumBold}>
            {props.title}
          </Text>
          <Spacer.Vertical value="sm" />
          <Text numberOfLines={3} style={constants.font.small}>
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

MakerOfTheWeek.Pending = () => (
  <View>
    <SectionTitle title="Maker of the Week" />
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <FastImage source={{}} style={makerOfTheWeekStyles.coverImage} />
      <ActivityIndicator
        size="large"
        color={constants.color.gray500}
        style={{ position: 'absolute' }}
      />
    </View>
    <Spacer.Vertical value="md" />
    <View style={makerOfTheWeekStyles.textContainer}>
      <View
        style={{ height: 19, backgroundColor: constants.color.placeholder }}
      />
      <Spacer.Vertical value="sm" />
      <View
        style={{ height: 17, backgroundColor: constants.color.placeholder }}
      />
    </View>
  </View>
);

const makerOfTheWeekStyles = StyleSheet.create({
  coverImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    height: 280,
    width: '100%',
    backgroundColor: constants.color.placeholder,
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
      <SectionTitle title="Limited offer" />
      <ProductItemCard productId={props.productId} />
    </View>
  );
}

type LandingScreenProps = HomeStackScreenProps<'Landing'>;

export default function LandingScreen(props: LandingScreenProps) {
  const $FUNC = '[LandingScreen]';
  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const [homeFeedData, setHomeFeedData] = React.useState<HomeFeedData>();
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
    analytics()
      .logScreenView({
        screen_name: 'Landing',
        screen_class: 'Landing',
      })
      .catch(error => console.warn($FUNC, 'Failed to log screen view:', error));
  }, []);

  React.useEffect(() => {
    if (isInitialRender || shouldRefresh)
      (async () => {
        try {
          console.log($FUNC, 'Fetching home feed data...');
          const homeFeedData = await fetchHomeFeedData();
          setHomeFeedData(homeFeedData);
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
  }, [isMounted, isInitialRender, shouldRefresh]);

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
      surveyResult: result.surveyResponse,
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
                'Get inspired by local, Australian creativity'
              }
              caption={
                homeFeedData?.callToAction.caption ??
                'Explore our carefully curated catalogue of products made by ' +
                  'our local makers'
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
              <Text
                style={[
                  constants.font.h2,
                  {
                    color: constants.color.absoluteWhite,
                    fontSize: constants.font.size.h2 * 0.8,
                  },
                ]}>
                Shop Now
              </Text>
            </TouchableHighlight>
            {(isInitialRender || shouldRefresh) && !homeFeedData ? (
              <MakerOfTheWeek.Pending />
            ) : homeFeedData ? (
              <MakerOfTheWeek {...homeFeedData.makerOfTheWeek} />
            ) : null}
            <SectionTitle title="Our picks for the week" />
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
      <OnboardingModal
        transparent
        animationType="fade"
        visible={isModalVisible}
      />
    </OnboardingModalContext.Provider>
  );
}
