import * as React from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/core';

import * as constants from 'src/constants';
import * as notificationsSlice from './notifications-slice';
import FeedFooter from 'src/features/feed/FeedFooter';
import { Button, EmptyContainer, Spacer } from 'src/components';
import { Notification } from 'src/models';
import { FacadeBottomTabScreenProps } from 'src/navigation';
import { useAppDispatch, useAppSelector } from 'src/hooks';

type NotificationsScreenProps = FacadeBottomTabScreenProps<'Notifications'>;

export default function NotificationsScreen(props: NotificationsScreenProps) {
  const $FUNC = '[NotificationsScreen]';
  const dispatch = useAppDispatch();

  const notifications = useAppSelector(
    notificationsSlice.selectAllNotifications,
  );

  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(() => {
        console.log($FUNC, 'Marking all notifications as read...');
        dispatch(notificationsSlice.markAllNotificationsAsRead());
      }, 2000);

      return () => clearTimeout(timer);
    }, [dispatch]),
  );

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: ({}) => (
        <Button
          title="Clear All"
          size="medium"
          type="primary"
          textStyle={{ textAlign: 'right' }}
          containerStyle={{
            alignItems: 'flex-end',
            paddingHorizontal: 0,
            marginRight: constants.layout.defaultScreenMargins.horizontal,
          }}
        />
      ),
    });
  }, [props.navigation]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <NotificationItem notification={item} />}
        refreshControl={
          <RefreshControl
            refreshing={false}
            tintColor={constants.color.gray500}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
        ItemSeparatorComponent={() => (
          <View
            style={{
              width: '100%',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: constants.color.gray200,
              alignSelf: 'center',
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyContainer
            emoji="🔔"
            title="You're up to date"
            message="You don't have any notifications at the moment."
          />
        }
        ListFooterComponent={
          notifications.length > 0 ? <FeedFooter didReachEnd /> : undefined
        }
      />
    </SafeAreaView>
  );
}

type NotificationItemProps = {
  notification: Notification;
};

function NotificationItem(props: NotificationItemProps) {
  const { notification } = props;
  return (
    <TouchableHighlight
      underlayColor={
        !notification.read
          ? constants.color.teal500 + '40'
          : constants.color.gray500
      }
      onPress={() => {}}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            padding: constants.layout.spacing.md * 1.5,
            backgroundColor: constants.color.absoluteWhite,
          },
          !notification.read && {
            backgroundColor: constants.color.teal500 + '40',
          },
        ]}>
        <Icon
          name="heart"
          size={24}
          style={{ width: 24 }}
          color={constants.color.defaultDarkTextColor}
        />
        <Spacer.Horizontal value="md" />
        <View style={[{ flex: 1 }]}>
          <Text numberOfLines={1} style={[constants.font.mediumBold]}>
            {notification.title}
          </Text>
          <Spacer.Vertical value="xs" />
          <Text numberOfLines={2} style={[constants.font.small]}>
            {notification.message}
          </Text>
        </View>
        <Spacer.Horizontal value="md" />
        <Icon name="close" size={24} color={constants.color.danger} />
        <Spacer.Horizontal value="md" />
        <Icon
          name="chevron-forward"
          size={24}
          color={constants.color.defaultDarkTextColor}
        />
      </View>
    </TouchableHighlight>
  );
}
