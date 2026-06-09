const mockAuth = {
  signInWithPhoneNumber: jest.fn(),
  currentUser: null,
};
export default () => mockAuth;
