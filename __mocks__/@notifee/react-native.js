export default {
  requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
  createChannel: jest.fn(() => Promise.resolve()),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  createTriggerNotification: jest.fn(() => Promise.resolve()),
};
export const RepeatFrequency = { DAILY: 'DAILY' };
export const TriggerType = { TIMESTAMP: 'TIMESTAMP' };
