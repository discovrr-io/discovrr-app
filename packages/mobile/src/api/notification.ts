import Parse from 'parse/react-native';

import { Notification, NotificationId, SessionId } from 'src/models';
import { Pagination } from 'src/models/common';

export namespace NotificationApi {
  export type SetFCMRegistrationTokenForSessionParams = {
    sessionId: SessionId;
    registrationToken: string;
    appVersion?: string;
    storeVersion?: string;
  };

  export async function setFCMRegistrationTokenForSession(
    params: SetFCMRegistrationTokenForSessionParams,
  ) {
    await Parse.Cloud.run('setFCMRegistrationTokenForSession', params);
  }

  //#region READ OPERATIONS

  export type FetchNotificationsParams = {
    pagination: Pagination;
  };

  export async function fetchNotifications(
    props: FetchNotificationsParams,
  ): Promise<Notification[]> {
    const { pagination } = props;
    const notificationsQuery = new Parse.Query('Notification')
      .descending('createdAt')
      .limit(pagination.limit);

    if (pagination.oldestDateFetched) {
      notificationsQuery.lessThan('createdAt', pagination.oldestDateFetched);
    } else {
      notificationsQuery.skip(pagination.currentPage * pagination.limit);
    }

    const notifications = await notificationsQuery.find();
    return notifications.map((notification): Notification => {
      const { title, body, imageUrl, data } = notification.attributes;
      return {
        id: notification.id as NotificationId,
        title,
        body,
        imageUrl,
        imageShape: data?.imageShape,
        read: true,
        type: data?.type,
        link: data?.link,
        receivedAt: notification.createdAt.toISOString(),
      };
    });
  }

  //#endregion READ OPERATIONS
}
