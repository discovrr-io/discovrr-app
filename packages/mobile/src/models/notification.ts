import { EntityId } from '@reduxjs/toolkit';

export type NotificationId = EntityId & { __notificationIdBrand: any };

export default interface Notification {
  readonly id: NotificationId;
  readonly title: string;
  readonly body: string;
  readonly read: boolean;
  readonly receivedAt: string;
  readonly type?: string;
  readonly link?: string;
  readonly imageUrl?: string;
  readonly imageShape?: string;
}
