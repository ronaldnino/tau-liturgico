import notifee, { RepeatFrequency, TriggerType } from '@notifee/react-native';

const CHANNEL_ID = 'tau-daily';

const NotificationService = {
  requestPermission: async () => {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1;
  },

  ensureChannel: () =>
    notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Recordatorio diario',
      vibration: false,
    }),

  scheduleDailyReminder: async (hour = 7, minute = 0) => {
    await NotificationService.ensureChannel();
    await notifee.cancelAllNotifications();

    const now = new Date();
    const trigger = new Date(now);
    trigger.setHours(hour, minute, 0, 0);
    if (trigger <= now) trigger.setDate(trigger.getDate() + 1);

    await notifee.createTriggerNotification(
      {
        title: 'τau Litúrgico',
        body: 'Las lecturas del día te están esperando.',
        android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: trigger.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      }
    );
  },

  cancelAll: () => notifee.cancelAllNotifications(),
};

export default NotificationService;
