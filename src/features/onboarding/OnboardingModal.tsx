import * as React from 'react';
import {
  Modal,
  ModalBaseProps,
  ScrollView,
  Text,
  TouchableOpacity,
  // TouchableWithoutFeedback,
  View,
} from 'react-native';

import Carousel, { Pagination } from 'react-native-snap-carousel';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { Button, Cell, Spacer } from 'src/components';
import { useExtendedTheme } from 'src/hooks';

type OnboardingPage = {
  id: 'home' | 'explore' | 'survey' | 'post';
  image?: number;
  title: string;
  body: string;
};

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    id: 'home',
    title: 'Home',
    image: require('../../../assets/images/onboarding/home.png'),
    body: 'The Home tab gives you an overview of stories and featured products curated just for you',
  },
  {
    id: 'explore',
    title: 'Explore',
    image: require('../../../assets/images/onboarding/explore.png'),
    body: 'The Explore tab is a place where you can see posts and products made by your local makers and other users',
  },
  {
    id: 'survey',
    title: 'A quick question',
    body: 'Where did you hear about us?',
  },
  {
    id: 'post',
    title: 'Start posting!',
    image: require('../../../assets/images/onboarding/post.png'),
    body: 'Press the plus icon below to make your first post on your favourite local maker!',
  },
];

export type OnboardingResult = {
  surveyResponse?: string;
  setSurveyResponse?: React.Dispatch<React.SetStateAction<string>>;
};

export const OnboardingModalContext = React.createContext<{
  completeOnboarding: (result: OnboardingResult) => void;
  skipOnboarding: () => void;
}>(null as any);

const OnboardingModalResultContext = React.createContext<OnboardingResult>(
  null as any,
);

export default function OnboardingModal(props: ModalBaseProps) {
  // const bottomTabHeight = useBottomTabBarHeight();
  // const modalContext = React.useContext(OnboardingModalContext);
  const { colors } = useExtendedTheme();

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [surveyResponse, setSurveyResponse] = React.useState('');

  const renderContent = React.useCallback(() => {
    switch (currentIndex) {
      case 1:
        return <OnboardingModalInfoContent />;
      case 0:
      default:
        return (
          <OnboardingModalGreetingContent
            onStartOnboarding={() => setCurrentIndex(1)}
          />
        );
    }
  }, [currentIndex]);

  return (
    <OnboardingModalResultContext.Provider
      value={{ surveyResponse, setSurveyResponse }}>
      <Modal transparent statusBarTranslucent animationType="fade" {...props}>
        <View style={{ width: '100%', height: '100%' }}>
          <SafeAreaView
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                constants.color.absoluteBlack + utilities.percentToHex(0.5),
            }}>
            <View
              style={{
                width: '85%',
                height: '75%',
                backgroundColor: colors.card,
                borderRadius: constants.layout.radius.lg,
                justifyContent: 'center',
              }}>
              {renderContent()}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </OnboardingModalResultContext.Provider>
  );
}

function OnboardingModalGreetingContent(props: {
  onStartOnboarding: () => void;
}) {
  const modalContext = React.useContext(OnboardingModalContext);
  const { colors } = useExtendedTheme();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: constants.layout.spacing.xxl,
        paddingTop: constants.layout.spacing.xxl * 1.75,
        paddingBottom: constants.layout.spacing.lg,
      }}>
      <Text style={[constants.font.h2, { color: colors.text, flexGrow: 1 }]}>
        Hi there 👋
      </Text>
      <View style={{ flexGrow: 1 }}>
        <Text style={[constants.font.large, { color: colors.text }]}>
          Welcome! Discovrr is a place where you can explore and see what local
          makers and creators are making in your community.
        </Text>
        <Spacer.Vertical value="lg" />
        <Text style={[constants.font.large, { color: colors.text }]}>
          This is Discovrr v{constants.values.APP_VERSION}. Please report any
          bugs or give your feedback to{' '}
          <Text
            style={{
              color: constants.color.accent,
              textDecorationLine: 'underline',
            }}>
            milos@discovrr.app
          </Text>
          {'.'}
        </Text>
      </View>
      <View>
        <Spacer.Vertical value="lg" />
        <Button
          title="Show Me Around"
          type="primary"
          variant="contained"
          onPress={props.onStartOnboarding}
        />
        <Spacer.Vertical value="sm" />
        <Button
          title="Skip For Now"
          size="small"
          onPress={() => modalContext.skipOnboarding()}
        />
      </View>
    </ScrollView>
  );
}

function OnboardingModalInfoContent() {
  const [carouselWidth, setCarouselWidth] = React.useState(1);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const carouselRef = React.useRef<Carousel<OnboardingPage> | null>(null);
  const { colors } = useExtendedTheme();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        flexShrink: 1,
        justifyContent: 'center',
        marginVertical: constants.layout.spacing.lg,
      }}
      onLayout={({ nativeEvent }) =>
        setCarouselWidth(nativeEvent.layout.width)
      }>
      <Carousel
        ref={c => (carouselRef.current = c)}
        data={ONBOARDING_PAGES}
        sliderWidth={carouselWidth}
        itemWidth={carouselWidth}
        onSnapToItem={setCurrentIndex}
        renderItem={({ item }) => <OnboardingModalInfoContentPage {...item} />}
      />
      <Pagination
        activeDotIndex={currentIndex}
        dotColor={colors.caption}
        inactiveDotColor={colors.captionDisabled}
        dotsLength={ONBOARDING_PAGES.length}
        containerStyle={{
          paddingTop: constants.layout.spacing.md,
          paddingBottom: constants.layout.spacing.md,
        }}
      />
      {currentIndex !== 0 && (
        <TouchableOpacity
          onPress={() => carouselRef.current?.snapToPrev(true)}
          style={{
            position: 'absolute',
            left: constants.layout.spacing.md,
          }}>
          <Icon name="chevron-back-outline" size={30} color={colors.text} />
        </TouchableOpacity>
      )}
      {currentIndex < ONBOARDING_PAGES.length - 1 && (
        <TouchableOpacity
          onPress={() => carouselRef.current?.snapToNext(true)}
          style={{
            position: 'absolute',
            right: constants.layout.spacing.md,
          }}>
          <Icon name="chevron-forward-outline" size={30} color={colors.text} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function OnboardingModalInfoContentPage(props: OnboardingPage) {
  const modalContext = React.useContext(OnboardingModalContext);
  const modalResultContext = React.useContext(OnboardingModalResultContext);
  const { colors } = useExtendedTheme();

  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: constants.layout.spacing.xl,
      }}>
      {props.image && (
        <FastImage
          resizeMode="contain"
          source={props.image}
          style={{
            width: '80%',
            aspectRatio: 1,
            marginBottom: constants.layout.spacing.lg,
          }}
        />
      )}
      <Text
        style={[
          constants.font.extraLargeBold,
          { color: colors.text, textAlign: 'center' },
        ]}>
        {props.title}
      </Text>
      <Spacer.Vertical value="md" />
      <Text
        style={[
          constants.font.body,
          { color: colors.text, textAlign: 'center' },
        ]}>
        {props.body}
      </Text>
      {props.id === 'survey' && (
        <Cell.Group
          containerStyle={{
            width: '90%',
            marginTop: constants.layout.spacing.lg,
            backgroundColor: colors.card,
          }}>
          <Cell.OptionGroup
            value={modalResultContext.surveyResponse || ''}
            onValueChanged={value =>
              modalResultContext.setSurveyResponse?.(value)
            }>
            <Cell.Option label="Facebook" value="facebook" />
            <Cell.Option label="Instagram" value="instagram" />
            <Cell.Option label="YouTube" value="youtube" />
            <Cell.Option label="Discovrr Website" value="website" />
            <Cell.Option label="A Friend" value="friend" />
            <Cell.Option label="Other" value="other" />
          </Cell.OptionGroup>
        </Cell.Group>
      )}
      {props.id === 'post' && (
        <Button
          title="Let's Start"
          size="medium"
          type="primary"
          variant="contained"
          loading={isLoading}
          containerStyle={{
            minWidth: 160,
            marginTop: constants.layout.spacing.md,
          }}
          onPress={() => {
            setIsLoading(true);
            modalContext.completeOnboarding(modalResultContext);
          }}
        />
      )}
    </ScrollView>
  );
}
