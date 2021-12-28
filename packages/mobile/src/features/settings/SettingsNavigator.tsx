import React from 'react';

import { RootStack } from 'src/navigation';

import MainSettingsScreen from './MainSettingsScreen';
import ProfileSettingsScreen from './ProfileSettingsScreen';
import AccountTypeSettingsScreen from './AccountTypeSettingsScreen';
import NotificationsSettingsScreen from './NotificationSettings';
import AppearanceSettingsScreen from './AppearanceSettings';

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
        options={{ title: 'My Profile' }}
      />
      <RootStack.Screen
        name="AccountTypeSettings"
        component={AccountTypeSettingsScreen}
        options={{ title: 'Account Type' }}
      />
      <RootStack.Screen
        name="NotificationSettings"
        component={NotificationsSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
      <RootStack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{ title: 'Appearance Settings' }}
      />
    </RootStack.Group>
  );
}
