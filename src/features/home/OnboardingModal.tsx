import * as React from 'react';
import {
  Modal,
  ModalBaseProps,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Carousel, { Pagination } from 'react-native-snap-carousel';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as constants from 'src/constants';
import { Button, Cell, Spacer } from 'src/components';

type OnboardingScreen = {
  id: 'home' | 'explore' | 'survey' | 'post';
  image?: number;
  title: string;
  body: string;
};

const ONBOARDING_SCREENS: OnboardingScreen[] = [
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
  const bottomTabHeight = useBottomTabBarHeight();

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
      <Modal {...props}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: constants.color.absoluteBlack + '80',
            paddingBottom: bottomTabHeight,
          }}>
          <SafeAreaView
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View
              style={{
                width: '85%',
                height: '75%',
                backgroundColor: 'white',
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

  return (
    <View
      style={{
        flexGrow: 1,
        paddingHorizontal: constants.layout.spacing.xxl,
        paddingTop: constants.layout.spacing.xxl * 1.75,
        paddingBottom: constants.layout.spacing.xl,
      }}>
      <Text style={[constants.font.h2, { flexGrow: 1 }]}>Hi there 👋</Text>
      <View style={{ flexGrow: 1 }}>
        <Text style={[constants.font.medium]}>
          Welcome! Discovrr is a place where you can explore and see what local
          makers and creators are making in your community.
        </Text>
        <Spacer.Vertical value="lg" />
        <Text style={[constants.font.medium]}>
          This is Discovrr v{constants.values.APP_VERSION}. Please report any
          bugs or give your feedback to{' '}
          <Text
            style={{
              color: constants.color.accent,
              textDecorationLine: 'underline',
            }}>
            milos@discovrr.app
          </Text>
        </Text>
      </View>
      <View>
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
    </View>
  );
}

function OnboardingModalInfoContent() {
  const [carouselWidth, setCarouselWidth] = React.useState(1);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const carouselRef = React.useRef<Carousel<OnboardingScreen> | null>(null);

  return (
    <View
      style={{
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
        data={ONBOARDING_SCREENS}
        sliderWidth={carouselWidth}
        itemWidth={carouselWidth}
        onSnapToItem={setCurrentIndex}
        renderItem={({ item }) => <OnboardingModalInfoContentPage {...item} />}
      />
      <Pagination
        activeDotIndex={currentIndex}
        dotsLength={ONBOARDING_SCREENS.length}
        containerStyle={{
          paddingTop: 0,
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
          <Icon
            name="chevron-back-outline"
            size={30}
            color={constants.color.defaultDarkTextColor}
          />
        </TouchableOpacity>
      )}
      {currentIndex < ONBOARDING_SCREENS.length - 1 && (
        <TouchableOpacity
          onPress={() => carouselRef.current?.snapToNext(true)}
          style={{
            position: 'absolute',
            right: constants.layout.spacing.md,
          }}>
          <Icon
            name="chevron-forward-outline"
            size={30}
            color={constants.color.defaultDarkTextColor}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

function OnboardingModalInfoContentPage(props: OnboardingScreen) {
  const modalContext = React.useContext(OnboardingModalContext);
  const modalResultContext = React.useContext(OnboardingModalResultContext);

  return (
    <View
      style={{
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
      <Text style={[constants.font.extraLargeBold, { textAlign: 'center' }]}>
        {props.title}
      </Text>
      <Spacer.Vertical value="md" />
      <Text style={[constants.font.medium, { textAlign: 'center' }]}>
        {props.body}
      </Text>
      {props.id === 'survey' && (
        <Cell.Group
          containerStyle={{
            width: '90%',
            marginTop: constants.layout.spacing.lg,
          }}>
          <Cell.Select
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
          </Cell.Select>
        </Cell.Group>
      )}
      {props.id === 'post' && (
        <Button
          title="Let's Start"
          size="medium"
          type="primary"
          variant="contained"
          onPress={() => modalContext.completeOnboarding(modalResultContext)}
          containerStyle={{ marginTop: constants.layout.spacing.md }}
        />
      )}
    </View>
  );
}
