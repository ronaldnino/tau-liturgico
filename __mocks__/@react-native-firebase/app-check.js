const mockAppCheck = {
  getToken: jest.fn(() => Promise.resolve({ token: 'mock-app-check-token' })),
};
export default () => mockAppCheck;
