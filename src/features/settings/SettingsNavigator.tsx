import React from 'react';

import { RootStack } from 'src/navigation';

import MainSettingsScreen from './MainSettingsScreen';
import ProfileSettingsScreen from './ProfileSettingsScreen';
import AccountTypeSettingsScreen from './AccountTypeSettingsScreen';
import NotificationsSettingsScreen from './NotificationSettings';
import { color } from 'src/constants';

export default function renderSettingsNavigator() {
  return (
    <RootStack.Group
      screenOptions={{ cardStyle: { backgroundColor: color.white } }}>
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
        name="AccountTypeSettings"
        component={AccountTypeSettingsScreen}
        options={{ title: 'Account Type' }}
      />
      <RootStack.Screen
        name="NotificationSettings"
        component={NotificationsSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
    </RootStack.Group>
  );
}
