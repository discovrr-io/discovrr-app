import * as React from 'react';
import { FlatList, SafeAreaView } from 'react-native';

import { useFocusEffect } from '@react-navigation/core';

import { EmptyContainer } from 'src/components';
import { useAppDispatch } from 'src/hooks';
import { FacadeBottomTabScreenProps } from 'src/navigation';

import { markAllNotificationsAsRead } from './notifications-slice';

type NotificationsScreenProps = FacadeBottomTabScreenProps<'Notifications'>;

export default function NotificationsScreen(_: NotificationsScreenProps) {
  const $FUNC = '[NotificationsScreen]';
  const dispatch = useAppDispatch();

  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(() => {
        console.log($FUNC, 'Marking all notifications as read...');
        dispatch(markAllNotificationsAsRead());
      }, 2000);

      return () => clearTimeout(timer);
    }, [dispatch]),
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={[]}
        renderItem={() => null}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyContainer
            emoji="🔔"
            title="You're up to date"
            message="You don't have any notifications at the moment."
          />
        }
      />
    </SafeAreaView>
  );
}
