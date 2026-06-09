export default {
  speak: jest.fn(),
  stop: jest.fn(),
  voices: jest.fn(() => Promise.resolve([])),
  setDefaultLanguage: jest.fn(() => Promise.resolve()),
  setDefaultPitch: jest.fn(() => Promise.resolve()),
  setDefaultRate: jest.fn(() => Promise.resolve()),
  setDefaultVoice: jest.fn(() => Promise.resolve()),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};
