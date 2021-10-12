import React from 'react';
import { FlatList, SafeAreaView } from 'react-native';
import { EmptyContainer } from 'src/components';
import { FacadeBottomTabScreenProps } from 'src/navigation';

type NotificationsScreenProps = FacadeBottomTabScreenProps<'Notifications'>;

export default function NotificationsScreen(_: NotificationsScreenProps) {
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
