import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import Parse from 'parse/react-native';

import * as constants from 'src/constants';
import * as values from 'src/constants/values';
import { Spacer } from 'src/components';
import { SettingsStackScreenProps } from 'src/navigation';

import Cell from './components';
import { CELL_GROUP_VERTICAL_SPACING } from './components/CellGroup';

type MainSettingsScreenProps = SettingsStackScreenProps<'MainSettings'>;

export default function MainSettingsScreen(_: MainSettingsScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: constants.layout.defaultScreenMargins.vertical,
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

export function MainSettingsScreenFooter() {
  return (
    <View>
      <View style={footerStyles.container}>
        <Text style={[constants.font.small, footerStyles.text]}>
          <Text style={[constants.font.smallBold, footerStyles.text]}>
            Discovrr {values.APP_VERSION}
          </Text>
          <Text> </Text> {/* Empty space character */}
          <Text>(Build {values.APP_BUILD})</Text>
        </Text>
      </View>
      <Spacer.Vertical value={constants.layout.spacing.sm} />
      <Text style={[constants.font.small, footerStyles.text]}>
        {Parse.serverURL}
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
    color: constants.color.gray500,
  },
});
