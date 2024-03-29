import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
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

import {
  useLinkTo,
  useNavigation,
  useScrollToTop,
} from '@react-navigation/native';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as authSlice from 'src/features/authentication/auth-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import ProductItemCard from 'src/features/products/ProductItemCard';
import { ProductId, Profile } from 'src/models';
import { HomeStackScreenProps, RootStackNavigationProp } from 'src/navigation';

import {
  EmptyContainer,
  LoadingContainer,
  MasonryList,
  SignInHeaderCard,
  Spacer,
  Text,
} from 'src/components';

import {
  useAppDispatch,
  useAppSelector,
  useExtendedTheme,
  useIsMounted,
} from 'src/hooks';

const TILE_SPACING = constants.values.DEFAULT_TILE_SPACING;
const EXPLORE_OUR_MAKERS_NUM_COLUMNS = 2;

const MAKER_OF_THE_WEEK_TITLE = 'Maker of the week';
const OUR_PICKS_FOR_THE_WEEK_TITLE = 'Our picks for the week';
const WEEKLY_OFFER_TITLE = 'Weekly offer';
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
  weeklyOffer?: {
    url: string;
    width: number;
    height: number;
    link?: string;
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const {
    weeklyOfferImageUrl,
    weeklyOfferImageWidth = 1,
    weeklyOfferImageHeight = 1,
    weeklyOfferImageLink,
  } = homeFeedData.attributes;

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
    weeklyOffer: weeklyOfferImageUrl
      ? {
          url: weeklyOfferImageUrl,
          width: weeklyOfferImageWidth,
          height: weeklyOfferImageHeight,
          link: weeklyOfferImageLink,
        }
      : undefined,
  };
}

type SectionTitleProps = {
  title: string;
  style?: StyleProp<ViewStyle>;
};

function SectionTitle(props: SectionTitleProps) {
  return (
    <View style={[sectionTitleProps.container, props.style]}>
      <Text
        size="h2"
        weight="800"
        allowFontScaling={false}
        style={[sectionTitleProps.title]}>
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

type CallToActionCardProps = HomeFeedData['callToAction'];

function CallToActionCard(props: CallToActionCardProps) {
  return (
    <View style={[landingScreenStyles.card, callToActionCardStyles.card]}>
      <Text
        size="h2"
        weight="800"
        allowFontScaling={false}
        style={[
          {
            color: constants.color.absoluteWhite,
            fontSize: constants.font.size.h2,
          },
          { textAlign: 'center' },
        ]}>
        {props.title}
      </Text>
      <Spacer.Vertical value="md" />
      <Text
        size="lg"
        allowFontScaling={false}
        style={[
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
        size="sm"
        weight="bold"
        style={[
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
    backgroundColor: constants.color.accentFocused,
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
        params: { screen: 'Feed', params: { screen: 'ProductsFeed' } },
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
          weight="bold"
          allowFontScaling={false}
          style={[
            {
              color: constants.color.absoluteWhite,
              fontSize: constants.font.size.h2 * 0.8,
            },
          ]}>
          Shop Now
        </Text>
        <Text
          weight="medium"
          style={[{ color: constants.color.absoluteWhite }]}>
          Tap here to browse our products
        </Text>
      </View>
    </TouchableHighlight>
  );
}

const shopNowCardStyle = StyleSheet.create({
  card: { minHeight: 190, backgroundColor: constants.color.teal500 },
});

type WeeklyOfferProps = NonNullable<HomeFeedData['weeklyOffer']>;

function WeeklyOffer(props: WeeklyOfferProps) {
  const linkTo = useLinkTo();
  const { colors } = useExtendedTheme();

  const handlePressImage = (link?: string) => {
    if (link) linkTo(link);
  };

  return (
    <View>
      <SectionTitle title={WEEKLY_OFFER_TITLE} />
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => handlePressImage(props.link)}>
        <FastImage
          resizeMode="cover"
          source={{ uri: props.url }}
          style={{
            width: '100%',
            aspectRatio: props.width / props.height,
            backgroundColor: colors.placeholder,
            borderRadius: constants.layout.radius.md,
          }}
        />
      </TouchableOpacity>
    </View>
  );
}

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
      analytics().logEvent('view_blog', { title: props.title });
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
          <Text weight="bold" numberOfLines={1}>
            {props.title}
          </Text>
          <Spacer.Vertical value="sm" />
          <Text size="sm" numberOfLines={3}>
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
            weight="bold"
            numberOfLines={1}
            style={[{ textAlign: 'center' }]}>
            {profile.__publicName}
          </Text>
          <Text
            size="xs"
            numberOfLines={2}
            style={[
              { textAlign: 'center' },
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

  const currentUser = useAppSelector(authSlice.selectCurrentUser);

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

  return (
    <MasonryList
      ref={masonryListScrollViewRef}
      data={homeFeedData?.featuredProductIds ?? []}
      contentContainerStyle={{
        paddingVertical: currentUser ? constants.layout.spacing.lg : 0,
      }}
      refreshControl={
        <RefreshControl
          tintColor={constants.color.gray500}
          refreshing={!isInitialRender && shouldRefresh}
          onRefresh={handleRefresh}
        />
      }
      ListHeaderComponent={
        <>
          {!currentUser && (
            <SignInHeaderCard
              style={{ marginBottom: constants.layout.spacing.md * 1.5 }}
            />
          )}
          <View
            style={{
              paddingHorizontal:
                constants.layout.defaultScreenMargins.horizontal,
            }}>
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
            {homeFeedData?.weeklyOffer && (
              <WeeklyOffer {...homeFeedData.weeklyOffer} />
            )}
            {(isInitialRender || shouldRefresh) && !homeFeedData ? (
              <MakerOfTheWeek.Pending />
            ) : homeFeedData ? (
              <MakerOfTheWeek {...homeFeedData.makerOfTheWeek} />
            ) : null}
            <SectionTitle title={OUR_PICKS_FOR_THE_WEEK_TITLE} />
          </View>
        </>
      }
      ListFooterComponent={
        <View
          style={{
            paddingBottom: constants.layout.defaultScreenMargins.vertical,
            paddingHorizontal: constants.layout.defaultScreenMargins.horizontal,
          }}>
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
  );
}

const landingScreenStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: constants.layout.spacing.xl,
    borderRadius: constants.layout.radius.md,
    overflow: 'hidden',
  },
});
