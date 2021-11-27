import * as React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import codePush, { RemotePackage } from 'react-native-code-push';
import Config from 'react-native-config';
import Parse from 'parse/react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/core';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import * as constants from 'src/constants';
import { Cell, Spacer } from 'src/components';
import { CELL_GROUP_VERTICAL_SPACING } from 'src/components/cells/CellGroup';
import { RootStackScreenProps } from 'src/navigation';

import * as globalActions from 'src/global-actions';
import * as globalSelectors from 'src/global-selectors';
import * as utilities from 'src/utilities';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';

const UPDATE_INDICATOR_DIAMETER = 9;

const MainSettingsScreenContext = React.createContext<{
  showUpdatePopupIndicator: Animated.SharedValue<boolean>;
}>(null as any);

type MainSettingsScreenProps = RootStackScreenProps<'MainSettings'>;

export default function MainSettingsScreen(props: MainSettingsScreenProps) {
  const dispatch = useAppDispatch();
  const currentProfileKind = useAppSelector(
    globalSelectors.selectCurrentUserProfileKind,
  );

  const scrollViewRef = React.useRef<ScrollView>(null);
  const showUpdatePopupIndicator = useSharedValue(false);

  React.useEffect(() => {
    scrollViewRef.current?.flashScrollIndicators();
  }, []);

  const handlePressUpdatePopupIndicator = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleAlertNotAvailable = () => {
    utilities.alertUnavailableFeature();
  };

  const handlePressClearCache = () => {
    const clearCache = () => {
      dispatch(globalActions.resetAppState());
    };

    Alert.alert(
      'Clear Cache?',
      'You may experience slow load times after you clear the cache. ' +
        'This will improve in time the more you use the Discovrr app.' +
        '\n\nAre you sure you want to clear the cache anyway?',
      [
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: clearCache,
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <MainSettingsScreenContext.Provider value={{ showUpdatePopupIndicator }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* TODO: We don't want to show this if the user can already see
            the footer */}
        <UpdatePopupIndicator onPress={handlePressUpdatePopupIndicator} />
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            paddingTop: constants.layout.defaultScreenMargins.vertical,
            paddingBottom: constants.layout.spacing.huge,
            paddingHorizontal: constants.layout.defaultScreenMargins.horizontal,
          }}>
          <Cell.Group label="General">
            <Cell.Navigator
              label="My profile"
              iconName="happy-outline"
              onPress={navigation => navigation.push('ProfileSettings')}
            />
            <Cell.Navigator
              label="Account Type"
              iconName="person-outline"
              previewValue={currentProfileKind === 'vendor' ? 'Maker' : 'User'}
              onPress={navigation => navigation.push('AccountTypeSettings')}
            />
            {/* <Cell.Navigator
              label="Location accuracy"
              iconName="location-outline"
              onPress={handleAlertNotAvailable}
            /> */}
            <Cell.Navigator
              label="Notifications"
              iconName="notifications-outline"
              onPress={navigation => navigation.push('NotificationSettings')}
            />
            <Cell.Navigator
              label="Appearance"
              iconName="color-palette-outline"
              onPress={navigation => navigation.push('AppearanceSettings')}
            />
          </Cell.Group>
          <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
          <Cell.Group label="Advanced">
            <Cell.Button
              label="Clear cache"
              iconName="trash-outline"
              onPress={handlePressClearCache}
            />
            <Cell.Button
              label="Reset to default settings"
              iconName="sync-outline"
              onPress={handleAlertNotAvailable}
            />
          </Cell.Group>
          <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
          <Cell.Group label="About">
            <Cell.Navigator
              label="About Discovrr"
              iconName="information-circle-outline"
              onPress={() => {
                props.navigation.navigate('InAppWebView', {
                  title: 'About Discovrr',
                  destination: 'about-discovrr',
                });
              }}
            />
            <Cell.Navigator
              label="Privacy policy"
              iconName="key-outline"
              onPress={() => {
                props.navigation.navigate('InAppWebView', {
                  title: 'Privacy Policy',
                  destination: 'privacy-policy',
                });
              }}
            />
            <Cell.Navigator
              label="Terms and Conditions"
              iconName="receipt-outline"
              onPress={() => {
                props.navigation.navigate('InAppWebView', {
                  title: 'Terms and Conditions',
                  destination: 'terms-and-conditions',
                });
              }}
            />
          </Cell.Group>
          <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
          <MainSettingsScreenFooter />
        </ScrollView>
      </SafeAreaView>
    </MainSettingsScreenContext.Provider>
  );
}

type CheckUpdateStatus =
  | { state: 'checking' }
  | { state: 'up-to-date' }
  | { state: 'update-available'; result: RemotePackage }
  | { state: 'failed'; error?: any };

function MainSettingsScreenFooter() {
  const { showUpdatePopupIndicator } = React.useContext(
    MainSettingsScreenContext,
  );

  const isMounted = useIsMounted();
  const [checkUpdateStatus, setCheckUpdateStatus] =
    React.useState<CheckUpdateStatus>({ state: 'checking' });

  useFocusEffect(
    React.useCallback(
      () => {
        codePush
          .checkForUpdate()
          .then(update => {
            if (!isMounted.current) return;
            if (update) {
              showUpdatePopupIndicator.value = true;
              setCheckUpdateStatus({
                state: 'update-available',
                result: update,
              });
            } else {
              showUpdatePopupIndicator.value = false;
              setCheckUpdateStatus({ state: 'up-to-date' });
            }
          })
          .catch(error => {
            // console.warn('Failed to check update:', error);
            showUpdatePopupIndicator.value = false;
            if (isMounted.current)
              setCheckUpdateStatus({ state: 'failed', error });
          });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [showUpdatePopupIndicator],
    ),
  );

  const handlePressUpdateStatusLabel = React.useCallback(() => {
    if (checkUpdateStatus.state === 'update-available') {
      Alert.alert(
        'New Update Available',
        'This update will be installed the next time you restart Discovrr.' +
          `\n\nYou are currently on version ${constants.values.APP_VERSION}`,
      );
    } else if (checkUpdateStatus.state !== 'checking') {
      Alert.alert(
        "You're Up To Date",
        "You're currently using the latest version of Discovrr.",
      );
    }
  }, [checkUpdateStatus]);

  const UpdateStatusLabel = React.useCallback(() => {
    const defaultTextStyles = [constants.font.smallBold, footerStyles.text];

    if (checkUpdateStatus.state === 'checking') {
      return (
        <>
          <Animatable.View
            animation="fadeIn"
            direction="alternate"
            iterationCount="infinite"
            style={[
              footerStyles.indicator,
              { backgroundColor: constants.color.gray300 },
            ]}
          />
          <Spacer.Horizontal value="sm" />
          <Text style={defaultTextStyles}>Checking for updates…</Text>
        </>
      );
    } else if (checkUpdateStatus.state === 'update-available') {
      return (
        <>
          <Animatable.View
            animation="flash"
            iterationCount="infinite"
            iterationDelay={1500}
            style={[
              footerStyles.indicator,
              { backgroundColor: constants.color.orange500 },
            ]}
          />
          <Spacer.Horizontal value="sm" />
          <Text
            style={[defaultTextStyles, { color: constants.color.orange500 }]}>
            An update is available
          </Text>
        </>
      );
    } else {
      return (
        <>
          <Animatable.View
            animation="fadeIn"
            direction="alternate"
            iterationCount="infinite"
            style={[
              footerStyles.indicator,
              { backgroundColor: constants.color.green500 },
            ]}
          />
          <Spacer.Horizontal value="sm" />
          <Text
            style={[defaultTextStyles, { color: constants.color.green500 }]}>
            You&apos;re up to date
          </Text>
        </>
      );
    }
  }, [checkUpdateStatus]);

  return (
    <View>
      <Text style={[constants.font.small, footerStyles.text]}>
        <Text style={[constants.font.smallBold, footerStyles.text]}>
          Discovrr {constants.values.APP_VERSION}
        </Text>
        <Text>&nbsp;({constants.values.STORE_VERSION})</Text>
        {Config.ENV !== 'production' && <Text>&nbsp;[{Config.ENV}]</Text>}
      </Text>
      {Config.ENV !== 'production' && (
        <>
          <Spacer.Vertical value="sm" />
          <Text style={[constants.font.small, footerStyles.text]}>
            {Parse.serverURL}
          </Text>
        </>
      )}
      <Spacer.Vertical value="sm" />
      <TouchableOpacity
        activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
        onPress={handlePressUpdateStatusLabel}
        style={[footerStyles.container, { flexDirection: 'row' }]}>
        <UpdateStatusLabel />
      </TouchableOpacity>
    </View>
  );
}

const footerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  text: {
    textAlign: 'center',
    color: constants.color.gray500,
  },
  indicator: {
    width: UPDATE_INDICATOR_DIAMETER,
    height: UPDATE_INDICATOR_DIAMETER,
    borderRadius: UPDATE_INDICATOR_DIAMETER / 2,
  },
});

type UpdateIndicatorProps = {
  onPress?: () => void;
};

function UpdatePopupIndicator(props: UpdateIndicatorProps) {
  const { showUpdatePopupIndicator } = React.useContext(
    MainSettingsScreenContext,
  );

  const [indicatorHeight, setIndicatorHeight] = React.useState(0);

  const popupStyle = useAnimatedStyle(() => {
    return {
      top: showUpdatePopupIndicator.value
        ? withSpring(constants.layout.spacing.md * 1.5)
        : withSpring(-indicatorHeight),
      opacity: showUpdatePopupIndicator.value
        ? withTiming(1, { duration: 300 })
        : withTiming(0, { duration: 200 }),
    };
  }, [indicatorHeight]);

  const handlePressIndicator = () => {
    showUpdatePopupIndicator.value = false;
    props.onPress?.();
  };

  return (
    <Animated.View
      onLayout={e => setIndicatorHeight(e.nativeEvent.layout.height)}
      style={[popupStyle, updateIndicatorStyles.invisibleContainer]}>
      <TouchableHighlight
        underlayColor={constants.color.orange700}
        onPress={handlePressIndicator}
        style={[
          updateIndicatorStyles.touchableContainer,
          { borderRadius: indicatorHeight / 2 },
        ]}>
        <View style={updateIndicatorStyles.container}>
          <Icon
            name="arrow-down-outline"
            size={18}
            color={constants.color.white}
          />
          <Spacer.Horizontal value="sm" />
          <Text
            numberOfLines={1}
            style={[constants.font.small, { color: constants.color.white }]}>
            An update is available
          </Text>
        </View>
      </TouchableHighlight>
    </Animated.View>
  );
}

const updateIndicatorStyles = StyleSheet.create({
  invisibleContainer: {
    zIndex: 20,
    position: 'absolute',
    alignItems: 'center',
    alignSelf: 'center',
  },
  touchableContainer: {
    backgroundColor: constants.color.orange500,
    paddingVertical: constants.layout.spacing.md,
    paddingHorizontal: constants.layout.spacing.lg,
    maxWidth: 200,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
