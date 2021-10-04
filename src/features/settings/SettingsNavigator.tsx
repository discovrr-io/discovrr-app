import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getVersion } from 'react-native-device-info';

import { color, font, layout } from 'src/constants';
import { Spacer } from 'src/components';
import { RootStack, SettingsStackScreenProps } from 'src/navigation';

import Cell from './components';
import ProfileSettingsScreen from './ProfileSettingsScreen';
import NotificationsSettingsScreen from './NotificationSettings';
import { CELL_GROUP_VERTICAL_SPACING } from './components/CellGroup';

type MainSettingsScreenProps = SettingsStackScreenProps<'MainSettings'>;

function MainSettingsScreen(_: MainSettingsScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: layout.defaultScreenMargins.vertical,
          paddingHorizontal: layout.defaultScreenMargins.horizontal,
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
          />
          <Cell.Navigator
            label="Notifications"
            iconName="notifications-outline"
            onPress={navigation => navigation.push('NotificationSettings')}
          />
        </Cell.Group>
        <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
        <Cell.Group label="Display">
          <Cell.Navigator label="Dark mode" iconName="moon-outline" />
          <Cell.Navigator label="Font size" iconName="text-outline" />
        </Cell.Group>
        <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
        <Cell.Group label="About">
          <Cell.Navigator
            label="About Discovrr"
            iconName="information-circle-outline"
          />
          <Cell.Navigator
            label="Terms and Conditions"
            iconName="receipt-outline"
          />
        </Cell.Group>
        <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
        <MainSettingsScreenFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

function MainSettingsScreenFooter() {
  return (
    <View style={footerStyles.container}>
      <Text style={[font.small, footerStyles.text]}>
        <Text style={[font.smallBold, footerStyles.text]}>
          Discovrr {getVersion()}
        </Text>{' '}
        (Build 2021.09.12.01)
      </Text>
    </View>
  );
}

const footerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    textAlign: 'center',
  },
  text: {
    textAlign: 'center',
    color: color.gray500,
  },
});

export default function renderSettingsNavigator() {
  return (
    <RootStack.Group>
      <RootStack.Screen
        name="MainSettings"
        component={MainSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <RootStack.Screen
        name="ProfileSettings"
        component={ProfileSettingsScreen}
        options={{ title: 'Profile Settings' }}
      />
      <RootStack.Screen
        name="NotificationSettings"
        component={NotificationsSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
    </RootStack.Group>
  );
}
