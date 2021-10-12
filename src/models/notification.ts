import { EntityId } from '@reduxjs/toolkit';

export type NotificationId = EntityId & { __notificationIdBrand: any };

export default interface Notification {
  readonly id: NotificationId;
  readonly title: string;
  readonly message: string;
  readonly read: boolean;
}
