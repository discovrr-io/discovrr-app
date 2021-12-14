import * as React from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';

import * as semver from 'semver';
import Parse from 'parse/react-native';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as authSlice from 'src/features/authentication/auth-slice';
import { Button, DiscovrrIcon, Spacer } from 'src/components';
import { useAppDispatch, useExtendedTheme } from 'src/hooks';

export default function OutdatedModal() {
  const $FUNC = '[OutdatedModal]';
  const dispatch = useAppDispatch();
  const { dark } = useExtendedTheme();

  const [isOutdated, setIsOutdated] = React.useState<boolean>();
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const appStoreName = Platform.select({
    ios: 'App Store',
    default: 'Play Store',
  });

  React.useEffect(() => {
    if (isOutdated === undefined) {
      (async () => {
        try {
          console.log($FUNC, 'Fetching supported range from Parse...');
          const config = await Parse.Config.get();
          const supportedRange = config.get('SUPPORTED_CLIENT_RANGE');

          if (!supportedRange) {
            console.warn(
              $FUNC,
              'Supported client range not found. Aborting...',
            );
            return;
          } else {
            console.log($FUNC, 'Got supported range:', supportedRange);
          }

          const version = constants.values.APP_VERSION.replace('-native', '');
          const satisfies = semver.satisfies(version, supportedRange);
          setIsOutdated(!satisfies);
        } catch (error) {
          console.warn($FUNC, 'Failed to get oldest supported version:', error);
        }
      })();
    } else if (isOutdated) {
      setIsModalVisible(true);
    }
  }, [isOutdated]);

  React.useEffect(() => {
    dispatch(authSlice.setOutdatedModalVisibility(isModalVisible));
    if (isModalVisible) {
      StatusBar.setBarStyle('light-content', true);
    } else {
      StatusBar.setBarStyle(dark ? 'light-content' : 'dark-content', true);
    }
  }, [dispatch, isModalVisible, dark]);

  const handleGoToAppStore = async () => {
    const appStoreLink = Platform.select({
      ios: constants.values.IOS_APP_STORE_LINK,
      default: constants.values.ANDROID_PLAY_STORE_LINK,
    });

    const errorTitle = 'Cannot Open Link';
    const errorMessage = `Sorry, we weren't able to take you to the ${appStoreName} for you.`;

    if (!(await Linking.canOpenURL(appStoreLink))) {
      Alert.alert(errorTitle, errorMessage);
      return;
    }

    try {
      await Linking.openURL(appStoreLink);
    } catch (error) {
      console.warn($FUNC, 'Failed to open link:', error);
      Alert.alert(errorTitle, errorMessage);
    }
  };

  return (
    <Modal
      statusBarTranslucent
      animationType="fade"
      presentationStyle="fullScreen"
      visible={isModalVisible}>
      <SafeAreaView
        style={[
          { flexGrow: 1, backgroundColor: constants.color.accentFocused },
        ]}>
        <View
          style={[
            { flexGrow: 1, padding: constants.layout.spacing.xxl },
            Platform.OS === 'android' && {
              paddingTop:
                constants.layout.spacing.xxl + constants.layout.spacing.xl,
            },
          ]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <DiscovrrIcon
              size={40}
              color={constants.color.defaultLightTextColor}
            />
            <Text
              style={[
                constants.font.smallBold,
                { color: constants.color.defaultLightTextColor },
              ]}>
              Discovrr v{constants.values.APP_VERSION}
            </Text>
          </View>
          <Spacer.Vertical value="lg" />
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingBottom: constants.layout.spacing.xxl * 1.5,
            }}>
            <Text
              allowFontScaling={false}
              style={[
                constants.font.h2,
                { color: constants.color.defaultLightTextColor },
              ]}>
              Please update Discovrr
            </Text>
            <Spacer.Vertical value="lg" />
            <View>
              <Text
                style={[
                  constants.font.large,
                  { color: constants.color.defaultLightTextColor },
                ]}>
                You&apos;re using an unsupported version of Discovrr. This means
                that you won&apos;t get the latest features and bug fixes from
                us.
              </Text>
              <Spacer.Vertical value="md" />
              <Text
                style={[
                  constants.font.large,
                  { color: constants.color.defaultLightTextColor },
                ]}>
                To avoid this, head to the {appStoreName} and update Discovrr to
                the latest version.
              </Text>
            </View>
            <Spacer.Vertical value="xl" />
            <View>
              <Button
                title={`Take me to the ${appStoreName}`}
                variant="outlined"
                overrideTheme="light-content"
                innerTextProps={{ allowFontScaling: false }}
                onPress={handleGoToAppStore}
                underlayColor={
                  constants.color.accentDisabled + utilities.percentToHex(0.25)
                }
                containerStyle={{
                  borderColor: constants.color.absoluteWhite,
                }}
              />
              <Spacer.Vertical value="sm" />
              <Button
                title="Continue using outdated version"
                size="small"
                type="secondary"
                variant="text"
                overrideTheme="light-content"
                innerTextProps={{ maxFontSizeMultiplier: 1.25 }}
                onPress={() => setIsModalVisible(false)}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
