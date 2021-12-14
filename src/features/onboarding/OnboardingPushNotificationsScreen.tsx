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
import { Button } from 'src/components';
import { OnboardingContentContainer } from './components';

import {
  OnboardingStackScreenProps,
  RootStackNavigationProp,
} from 'src/navigation';

const APP_ICON = require('../../../assets/images/app-icon.png');
const APP_ICON_DEFAULT_HEIGHT = 180;
const NOTIFICATION_ICON_DEFAULT_SIZE = 36;

type OnboardingPushNotificationsScreenProps =
  OnboardingStackScreenProps<'OnboardingPushNotifications'>;

export default function OnboardingPushNotifications(
  props: OnboardingPushNotificationsScreenProps,
) {
  const [iconHeight, setIconHeight] = React.useState(APP_ICON_DEFAULT_HEIGHT);

  const notificationDotDiameter = React.useMemo(() => {
    return iconHeight * 0.3;
  }, [iconHeight]);

  const notificationDotBellIconSize = React.useMemo(() => {
    return (
      NOTIFICATION_ICON_DEFAULT_SIZE * (iconHeight / APP_ICON_DEFAULT_HEIGHT)
    );
  }, [iconHeight]);

  const notificationDotState = useSharedValue(0);
  const notificationDotStyle = useAnimatedStyle(() => ({
    opacity: notificationDotState.value,
    transform: [{ scale: notificationDotState.value }],
  }));

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <Button
          title="Maybe Later"
          size="medium"
          overrideTheme="light-content"
          textStyle={{ textAlign: 'right' }}
          containerStyle={{
            flex: 1,
            alignItems: 'flex-end',
            paddingHorizontal: 0,
            marginRight: constants.layout.defaultScreenMargins.horizontal,
          }}
        />
      ),
    });

    const unsubscribe = props.navigation.addListener('transitionEnd', () => {
      notificationDotState.value = withSpring(1);
    });

    return unsubscribe;
  }, [props.navigation, notificationDotState]);

  const handlePressNext = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // TODO: Do something useful with this (e.g applying notification
        // settings)
        console.log('Authorization status:', authStatus);
      }

      props.navigation.getParent<RootStackNavigationProp>().navigate('Main', {
        screen: 'Facade',
        params: { screen: 'Home', params: { screen: 'Landing' } },
      });
    } catch (error) {
      console.error('Failed to request permission', error);
    }
  };

  return (
    <OnboardingContentContainer
      title="Don’t miss out!"
      body={[
        'Allow push notifications to get real-time updates from your feed as well as product recommendations we’ll think you’ll love.',
        'You can always change or customise this later in the app settings.',
      ]}
      renderHeader={() => (
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
                name="notifications"
                color={constants.color.absoluteWhite}
                size={notificationDotBellIconSize}
              />
            </Animated.View>
          </View>
        </View>
      )}
      footerActions={[
        { title: 'Allow Push Notifications', onPress: handlePressNext },
      ]}
    />
  );
}
