const ONE_SIGNAL_URL = 'https://onesignal.com/api/v1/notifications';

export namespace NotificationApi {
  type LocalizedStrings = { en: string; [key: string]: string };

  export async function sendNotificationToProfileIds(
    profileIds: string[],
    headings: LocalizedStrings,
    contents: LocalizedStrings,
    url?: string,
  ) {
    console.log(
      '[NotificationApi.sendNotificationToProfileIds]',
      'Will send notification...',
    );

    const notificationParams = JSON.stringify({
      app_id: 'c20ba65b-d412-4a82-8cc4-df3ab545c0b1',
      include_external_user_ids: profileIds,
      channel_for_external_user_ids: 'push',
      headings,
      contents,
      app_url: url,
    });

    const fetchResponse = await fetch(ONE_SIGNAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        // FIXME: This should be private
        Authorization: 'Basic MmFmOGVlNWMtNjgzMC00MjNiLThiYjktYmEyN2VlNzkwMDQx',
      },
      body: notificationParams,
    });

    const response = await fetchResponse.json();
    console.log(
      '[NotificationApi.sendNotificationToProfileIds]',
      'Successfully sent notification:',
      response,
    );
  }
}
