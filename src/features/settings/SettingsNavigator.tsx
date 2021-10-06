import React from 'react';

import { RootStack } from 'src/navigation';

import ProfileSettingsScreen from './ProfileSettingsScreen';
import NotificationsSettingsScreen from './NotificationSettings';
import MainSettingsScreen from './MainSettingsScreen';

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
