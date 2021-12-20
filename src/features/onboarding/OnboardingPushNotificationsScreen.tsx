import * as React from 'react';
import { View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import * as constants from 'src/constants';
import * as notificationsSlice from 'src/features/notifications/notifications-slice';
import { useAppDispatch } from 'src/hooks';
import { OnboardingStackScreenProps } from 'src/navigation';

import { OnboardingContentContainer, SkipButton } from './components';
import { useDisableGoBackOnSubmitting } from './hooks';

const APP_ICON = require('../../../assets/images/app-icon.png');
const APP_ICON_DEFAULT_HEIGHT = 180;
const NOTIFICATION_ICON_DEFAULT_SIZE = 36;

type OnboardingPushNotificationsScreenProps =
  OnboardingStackScreenProps<'OnboardingPushNotifications'>;

export default function OnboardingPushNotifications(
  props: OnboardingPushNotificationsScreenProps,
) {
  const $FUNC = '[OnboardingPushNotifications]';
  const dispatch = useAppDispatch();
  const { nextIndex } = props.route.params;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [iconHeight, setIconHeight] = React.useState(APP_ICON_DEFAULT_HEIGHT);

  const notificationDotDiameter = React.useMemo(() => {
    return iconHeight * 0.3;
  }, [iconHeight]);

  const notificationDotState = useSharedValue(0);
  const notificationDotStyle = useAnimatedStyle(() => ({
    opacity: notificationDotState.value,
    transform: [{ scale: notificationDotState.value }],
  }));

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <SkipButton
          onPress={() =>
            props.navigation.navigate('OnboardingSurvey', {
              nextIndex: nextIndex + 1,
            })
          }
        />
      ),
    });
  }, [props.navigation, nextIndex]);

  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('transitionEnd', () => {
      notificationDotState.value = withSpring(1);
    });

    return unsubscribe;
  }, [props.navigation, notificationDotState]);

  useDisableGoBackOnSubmitting(isSubmitting);

  const handlePressNext = async () => {
    try {
      setIsSubmitting(true);
      const authStatus = await messaging().requestPermission();
      console.log($FUNC, 'Got authorization status:', authStatus);
      dispatch(notificationsSlice.setAuthorizationStatus(authStatus));
    } catch (error) {
      console.error('Failed to request permission. Aborting:', error);
    } finally {
      setIsSubmitting(false);
      props.navigation.navigate('OnboardingSurvey', {
        nextIndex: nextIndex + 1,
      });
    }
  };

  return (
    <OnboardingContentContainer
      page={nextIndex}
      title="Don’t miss out!"
      body={[
        'Allow push notifications from Discovrr to get real-time updates on your feed and product recommendations we think you’ll love.',
        'You can always customise your notification  settings later.',
      ]}
      footerActions={[
        {
          title: 'Allow Notifications',
          onPress: handlePressNext,
          loading: isSubmitting,
          disabled: isSubmitting,
        },
      ]}>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          onLayout={({ nativeEvent }) =>
            setIconHeight(nativeEvent.layout.height)
          }
          style={{
            aspectRatio: 1,
            height: '50%',
            maxHeight: APP_ICON_DEFAULT_HEIGHT,
          }}>
          <FastImage
            resizeMode="contain"
            source={APP_ICON}
            style={{ flexGrow: 1 }}
          />
          <Animated.View
            style={[
              notificationDotStyle,
              {
                position: 'absolute',
                top: -(notificationDotDiameter * 0.3),
                right: -(notificationDotDiameter * 0.3),
                width: notificationDotDiameter,
                aspectRatio: 1,
                borderRadius: notificationDotDiameter / 2,
                backgroundColor: constants.color.red500,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}>
            <Icon
              adjustsFontSizeToFit
              name="notifications"
              color={constants.color.absoluteWhite}
              size={NOTIFICATION_ICON_DEFAULT_SIZE}
              style={{ padding: notificationDotDiameter * 0.15 }}
            />
          </Animated.View>
        </View>
      </View>
    </OnboardingContentContainer>
  );
}
