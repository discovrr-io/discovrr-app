import * as React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

import * as constants from 'src/constants';
import { Cell, Spacer } from 'src/components';
import { CELL_GROUP_VERTICAL_SPACING } from 'src/components/cells/CellGroup';
import { RootStackScreenProps } from 'src/navigation';

type NotificationSettings = {
  postLike: boolean;
  postComment: boolean;
  profileFollow: boolean;
  profileMention: boolean;
  profileMessage: boolean;
};

const defaultNotificationSettings = {
  postLike: true,
  postComment: true,
  profileFollow: true,
  profileMention: true,
  profileMessage: true,
};

type NotificationsSettingsScreenProps =
  RootStackScreenProps<'NotificationSettings'>;

export default function NotificationsSettingsScreen(
  _: NotificationsSettingsScreenProps,
) {
  const [enableAllNotifications, setEnableAllNotifications] =
    React.useState(true);
  const [notifPrefs, setNotifPrefs] = React.useState(
    defaultNotificationSettings,
  );

  const handleChange = (
    setting: keyof NotificationSettings,
    value: boolean,
  ) => {
    setNotifPrefs(prev => ({ ...prev, [setting]: value }));
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={constants.layout.defaultScreenStyle}>
        <Cell.Group
          label="Global preferences"
          elementOptions={{
            containerSpacingVertical: constants.layout.spacing.md,
          }}>
          <Cell.Switch
            label="Enable all notifications"
            caption={
              enableAllNotifications
                ? 'You will receive activity notifications in addition to important security updates.'
                : 'You will only receive important security updates.'
            }
            value={enableAllNotifications}
            onValueChange={value => setEnableAllNotifications(value)}
          />
        </Cell.Group>
        <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
        <Cell.Group
          elementOptions={{
            disabled: !enableAllNotifications,
            containerSpacingVertical: constants.layout.spacing.md,
          }}
          label="Notify me when...">
          <Cell.Switch
            label="Someone likes my post"
            value={notifPrefs.postLike}
            onValueChange={value => handleChange('postLike', value)}
          />
          <Cell.Switch
            label="Someone comments on my post"
            value={notifPrefs.postComment}
            onValueChange={value => handleChange('postComment', value)}
          />
          <Cell.Switch
            label="Someone follows me"
            value={notifPrefs.profileFollow}
            onValueChange={value => handleChange('profileFollow', value)}
          />
          <Cell.Switch
            label="Someone mentions me"
            value={notifPrefs.profileMention}
            onValueChange={value => handleChange('profileMention', value)}
          />
          <Cell.Switch
            label="Someone messages me"
            value={notifPrefs.profileMessage}
            onValueChange={value => handleChange('profileMessage', value)}
          />
        </Cell.Group>
      </ScrollView>
    </SafeAreaView>
  );
}
