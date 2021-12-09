import * as React from 'react';
import {
  AppState,
  RefreshControl,
  SafeAreaView,
  SectionList,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatDistance } from 'date-fns';
import { useFocusEffect } from '@react-navigation/core';
import { useLinkTo, useScrollToTop } from '@react-navigation/native';

import * as constants from 'src/constants';
import * as globalSelectors from 'src/global-selectors';
import * as notificationsSlice from './notifications-slice';

// import FeedFooter from 'src/features/feed/FeedFooter';
import {
  Button,
  EmptyContainer,
  SignInPrompt,
  Spacer,
  Text,
} from 'src/components';
import { useAppDispatch, useAppSelector, useExtendedTheme } from 'src/hooks';
import { Notification } from 'src/models';
import { ResponsePagination } from 'src/models/common';
import { FacadeBottomTabScreenProps } from 'src/navigation';

const PAGINATION_LIMIT = 25;

type Section = {
  title: string;
  data: Notification[];
};

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function categoriseNotifications(notifications: Notification[]): Section[] {
  return notifications.reduce(
    (result, notification) => {
      const receivedToday = isToday(new Date(notification.receivedAt));
      result[receivedToday ? 0 : 1].data.push(notification);
      return result;
    },
    [
      { title: 'Today', data: [] },
      { title: 'Earlier', data: [] },
    ] as Section[],
  );
}

type NotificationsScreenProps = FacadeBottomTabScreenProps<'Notifications'>;

export default function NotificationsScreen(props: NotificationsScreenProps) {
  const $FUNC = '[NotificationsScreen]';
  const dispatch = useAppDispatch();
  const { colors } = useExtendedTheme();

  const profile = useAppSelector(globalSelectors.selectCurrentUserProfile);
  const notificationSections = useAppSelector(state =>
    categoriseNotifications(notificationsSlice.selectAllNotifications(state)),
  );

  const [shouldRefresh, setShouldRefresh] = React.useState(true);
  const [shouldFetchMore, setShouldFetchMore] = React.useState(false);
  const [pagination, setPagination] = React.useState<ResponsePagination>({
    currentPage: 0,
    didReachEnd: false,
  });

  const sectionListRef = React.useRef<SectionList>(null);
  useScrollToTop(sectionListRef);

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
          disabled={notificationSections.length === 0}
          textStyle={{ textAlign: 'right' }}
          innerTextProps={{ allowFontScaling: false }}
          onPress={() => dispatch(notificationsSlice.clearAllNotifications())}
          containerStyle={{
            alignItems: 'flex-end',
            paddingHorizontal: 0,
            marginRight: constants.layout.defaultScreenMargins.horizontal,
          }}
        />
      ),
    });
  }, [dispatch, notificationSections.length, props.navigation]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (pagination.didReachEnd && nextAppState === 'active') {
        console.log($FUNC, 'Screen active - will refresh notifications');
        setShouldRefresh(true);
      }
    });

    return () => subscription.remove();
  }, [pagination]);

  React.useEffect(() => {
    async function fetchAllNotifications() {
      try {
        console.log($FUNC, 'Fetching all notifications...');
        setPagination({ currentPage: 0, didReachEnd: false });

        const fetched = await dispatch(
          notificationsSlice.fetchNotifications({
            pagination: {
              currentPage: 0,
              limit: PAGINATION_LIMIT,
            },
          }),
        ).unwrap();

        if (fetched.length < PAGINATION_LIMIT) {
          setPagination(prev => ({
            ...prev,
            didReachEnd: true,
            oldestDataFetched:
              fetched.length > 0
                ? new Date(fetched[fetched.length - 1].receivedAt)
                : prev.oldestDataFetched,
          }));
        } else {
          setPagination(prev => ({
            ...prev,
            currentPage: 1,
            oldestDataFetched: new Date(fetched[fetched.length - 1].receivedAt),
          }));
        }
      } catch (error) {
        // It isn't important to notify the user that notifications failed to
        // fetch. Also, since this effect may run every time the app is active,
        // it isn't ideal to distract the user with the error in case they are
        // on a different screen.
        console.warn($FUNC, 'Failed to fetch notifications:', error);
      } finally {
        setShouldRefresh(false);
      }
    }

    if (profile && shouldRefresh) fetchAllNotifications();
  }, [dispatch, profile, shouldRefresh]);

  React.useEffect(
    () => {
      async function fetchMoreNotifications() {
        try {
          console.log($FUNC, 'Fetching more...');

          const fetched = await dispatch(
            notificationsSlice.fetchNotifications({
              pagination: {
                currentPage: pagination.currentPage,
                limit: PAGINATION_LIMIT,
              },
            }),
          ).unwrap();

          if (fetched.length < PAGINATION_LIMIT) {
            setPagination(prev => ({
              ...prev,
              didReachEnd: true,
              oldestDataFetched:
                fetched.length > 0
                  ? new Date(fetched[fetched.length - 1].receivedAt)
                  : prev.oldestDataFetched,
            }));
          } else {
            setPagination(prev => ({
              ...prev,
              currentPage: prev.currentPage + 1,
              oldestDataFetched: new Date(
                fetched[fetched.length - 1].receivedAt,
              ),
            }));
          }
        } catch (error) {
          console.warn($FUNC, 'Failed to fetch more notifications:', error);
        } finally {
          setShouldFetchMore(false);
        }
      }

      if (profile && shouldFetchMore) fetchMoreNotifications();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, profile, shouldFetchMore],
  );

  const handleRefresh = () => {
    if (!shouldRefresh && !shouldFetchMore) setShouldRefresh(true);
  };

  const handleFetchMore = () => {
    if (!shouldRefresh && !shouldFetchMore && !pagination.didReachEnd)
      setShouldFetchMore(true);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {profile ? (
        <SectionList
          ref={sectionListRef}
          sections={notificationSections}
          contentContainerStyle={{ flexGrow: 1 }}
          keyExtractor={item => String(item.id)}
          onEndReached={handleFetchMore}
          refreshControl={
            <RefreshControl
              refreshing={shouldRefresh}
              onRefresh={handleRefresh}
              tintColor={constants.color.gray500}
            />
          }
          renderItem={({ item }) => <NotificationItem notification={item} />}
          renderSectionHeader={({ section: { title, data } }) => {
            if (data.length === 0) return null;
            return (
              <Text
                size="h3"
                weight="900"
                style={{
                  paddingVertical: constants.layout.spacing.md,
                  paddingHorizontal: constants.layout.spacing.lg,
                }}>
                {title}
              </Text>
            );
          }}
          ItemSeparatorComponent={() => (
            <View
              style={{
                width: '100%',
                alignSelf: 'center',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
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
        />
      ) : (
        <SignInPrompt />
      )}
    </SafeAreaView>
  );
}

type NotificationItemProps = {
  notification: Notification;
};

function NotificationItem(props: NotificationItemProps) {
  const { notification } = props;
  const { colors, dark } = useExtendedTheme();

  const dispatch = useAppDispatch();
  const linkTo = useLinkTo();

  const iconName = React.useMemo(() => {
    switch (notification.type) {
      case 'post:like':
      case 'comment:like':
      case 'product:like':
        return 'heart';
      case 'post:comment':
        return 'chatbubble';
      case 'profile:follow':
        return 'person-add';
      case 'product:upload':
      case 'product:verify':
        return 'gift';
      default:
        return 'notifications';
    }
  }, [notification.type]);

  const handlePressNotification = () => {
    dispatch(notificationsSlice.markNotificationAsRead(notification.id));
    if (notification.link)
      linkTo(
        notification.link.startsWith('/')
          ? notification.link
          : `/${notification.link}`,
      );
  };

  return (
    <TouchableHighlight
      underlayColor={colors.highlight}
      onPress={handlePressNotification}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            padding: constants.layout.spacing.md * 1.5,
            backgroundColor: colors.card,
          },
          !notification.read && {
            backgroundColor: constants.color.teal500 + (dark ? '60' : '40'),
          },
        ]}>
        <Icon
          name={iconName + '-outline'}
          size={24}
          style={{ width: 24 }}
          color={colors.text}
        />
        <Spacer.Horizontal value={constants.layout.spacing.md * 1.5} />
        <View style={[{ flex: 1 }]}>
          <Text size="md" weight="700" numberOfLines={1}>
            {notification.title}
          </Text>
          <Spacer.Vertical value="xs" />
          <Text size="sm" numberOfLines={2}>
            {notification.message}
          </Text>
          <Spacer.Vertical value="xs" />
          <Text size="xs" color="caption" numberOfLines={1}>
            {formatDistance(new Date(notification.receivedAt), new Date(), {
              addSuffix: true,
              includeSeconds: true,
            })}
          </Text>
        </View>
        {Boolean(notification.imageUrl) && (
          <>
            <Spacer.Horizontal value="md" />
            <FastImage
              source={{ uri: notification.imageUrl }}
              style={{
                height: 40,
                aspectRatio: 1,
                backgroundColor: colors.placeholder,
                borderRadius:
                  notification.imageShape === 'circle'
                    ? 20
                    : constants.layout.spacing.md,
              }}
            />
          </>
        )}
        {Boolean(notification.link) && (
          <>
            <Spacer.Horizontal value="md" />
            <Icon name="chevron-forward" size={24} color={colors.text} />
          </>
        )}
      </View>
    </TouchableHighlight>
  );
}
