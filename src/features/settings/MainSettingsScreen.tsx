import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import codePush from 'react-native-code-push';
import Parse from 'parse/react-native';

import * as constants from 'src/constants';
import * as values from 'src/constants/values';
import { Cell, Spacer } from 'src/components';
import { CELL_GROUP_VERTICAL_SPACING } from 'src/components/cells/CellGroup';
import { RootStackScreenProps } from 'src/navigation';

import { useAppDispatch } from 'src/hooks';
import { resetAppState } from 'src/global-actions';
import { alertUnavailableFeature } from 'src/utilities';

const UPDATE_INDICATOR_DIAMETER = 9;

type MainSettingsScreenProps = RootStackScreenProps<'MainSettings'>;

export default function MainSettingsScreen(props: MainSettingsScreenProps) {
  const dispatch = useAppDispatch();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.flashScrollIndicators();
  }, []);

  const handleAlertNotAvailable = () => {
    alertUnavailableFeature();
  };

  const handlePressClearCache = () => {
    const commitClearCache = () => {
      dispatch(resetAppState());
    };

    Alert.alert(
      'Clear Cache?',
      'You may experience slow load times after you clear the cache. ' +
        'This will improve in time the more you use the Discovrr app.' +
        '\n\nAre you sure you want to clear the cache anyway?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: commitClearCache,
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          paddingTop: constants.layout.defaultScreenMargins.vertical,
          paddingBottom: constants.layout.spacing.huge,
          paddingHorizontal: constants.layout.defaultScreenMargins.horizontal,
        }}>
        <Cell.Group label="General">
          <Cell.Navigator
            label="Profile"
            iconName="person-outline"
            onPress={navigation => navigation.push('ProfileSettings')}
          />
          <Cell.Navigator
            label="Location accuracy"
            iconName="location-outline"
            onPress={handleAlertNotAvailable}
          />
          <Cell.Navigator
            label="Notifications"
            iconName="notifications-outline"
            onPress={navigation => navigation.push('NotificationSettings')}
          />
        </Cell.Group>
        <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
        <Cell.Group label="Display">
          <Cell.Navigator
            label="Dark mode"
            iconName="moon-outline"
            onPress={handleAlertNotAvailable}
          />
          <Cell.Navigator
            label="Font size"
            iconName="text-outline"
            onPress={handleAlertNotAvailable}
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
  );
}

export function MainSettingsScreenFooter() {
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);

  useEffect(() => {
    codePush
      .checkForUpdate()
      .then(update => update && setHasUpdateAvailable(true))
      .catch(() => {}); // Do nothing
  }, []);

  return (
    <View>
      {hasUpdateAvailable ? (
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'New Update Available',
              'This update will be installed the next time you restart ' +
                'Discovrr.\n\n' +
                `You are currently on version ${values.APP_VERSION}.`,
            )
          }
          style={[footerStyles.container, { flexDirection: 'row' }]}>
          <Animatable.View
            iterationCount="infinite"
            iterationDelay={1500}
            animation="flash"
            style={{
              backgroundColor: constants.color.orange500,
              width: UPDATE_INDICATOR_DIAMETER,
              height: UPDATE_INDICATOR_DIAMETER,
              borderRadius: UPDATE_INDICATOR_DIAMETER / 2,
            }}
          />
          <Spacer.Horizontal value="sm" />
          <Text
            style={[
              constants.font.smallBold,
              footerStyles.text,
              { color: constants.color.orange500 },
            ]}>
            An update is available
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
          onPress={() =>
            Alert.alert(
              'You’re Up to Date',
              "You're currently on the latest version of Discovrr.",
            )
          }>
          <View style={footerStyles.container}>
            <Text style={[constants.font.small, footerStyles.text]}>
              <Text style={[constants.font.smallBold, footerStyles.text]}>
                Discovrr {values.APP_VERSION}
              </Text>
              <Text>&nbsp;({values.STORE_VERSION})</Text>
            </Text>
          </View>
        </TouchableOpacity>
      )}
      <Spacer.Vertical value="sm" />
      <Text style={[constants.font.small, footerStyles.text]}>
        {Parse.serverURL}
      </Text>
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
});
