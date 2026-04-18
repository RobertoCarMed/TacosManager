/* eslint-env jest */

global.__DEV__ = true;

jest.mock('react-redux', () => {
  const React = require('react');

  return {
    Provider: ({children}) => React.createElement(React.Fragment, null, children),
    useDispatch: () => jest.fn(),
    useSelector: selector =>
      selector({
        orders: {
          error: null,
          isLoading: false,
          items: [],
        },
      }),
  };
});

jest.mock('react-native-gesture-handler', () => ({}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    NavigationContainer: ({children}) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({children}) =>
        React.createElement(React.Fragment, null, children),
      Screen: ({component: Component}) => React.createElement(Component),
    }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  return {
    SafeAreaProvider: ({children}) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaView: ({children}) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {
    app: jest.fn(() => ({})),
  },
}));

jest.mock('@react-native-firebase/auth', () => {
  const authInstance = {
    createUserWithEmailAndPassword: jest.fn(async () => ({
      user: {
        delete: jest.fn(async () => undefined),
        email: 'test@taqueria.com',
        uid: 'test-user',
      },
    })),
    signInWithEmailAndPassword: jest.fn(async () => ({
      user: {
        email: 'test@taqueria.com',
        uid: 'test-user',
      },
    })),
    onAuthStateChanged: callback => {
      callback(null);
      return jest.fn();
    },
    signInAnonymously: jest.fn(async () => ({user: {uid: 'test-user'}})),
    signOut: jest.fn(async () => undefined),
  };

  const authFactory = () => authInstance;
  authFactory.FirebaseAuthTypes = {};

  return authFactory;
});

jest.mock('@react-native-firebase/storage', () => {
  const reference = {
    getDownloadURL: jest.fn(async () => 'https://example.com/product.jpg'),
    putFile: jest.fn(async () => undefined),
  };

  const storageFactory = () => ({
    ref: jest.fn(() => reference),
  });

  return storageFactory;
});

jest.mock('@react-native-firebase/firestore', () => {
  const querySnapshot = {docs: []};
  const limitedCollectionRef = {
    get: jest.fn(async () => ({docs: [], empty: true})),
  };
  const collectionRef = {
    add: jest.fn(async () => ({id: 'order-1'})),
    doc: jest.fn(() => docRef),
    get: jest.fn(async () => ({docs: [], empty: true})),
    onSnapshot: jest.fn((onNext, _onError) => {
      onNext(querySnapshot);
      return jest.fn();
    }),
    orderBy: jest.fn(() => collectionRef),
    limit: jest.fn(() => limitedCollectionRef),
    where: jest.fn(() => collectionRef),
  };
  const docRef = {
    collection: jest.fn(() => collectionRef),
    id: 'mock-doc-id',
    get: jest.fn(async () => ({
      data: () => ({
        createdAt: Date.now(),
        email: 'test@taqueria.com',
        id: 'test-user',
        name: 'Test User',
        role: 'waiter',
        taqueriaId: 'taqueria-1',
      }),
      exists: true,
      id: 'test-user',
    })),
    set: jest.fn(async () => undefined),
    update: jest.fn(async () => undefined),
  };
  const firestoreInstance = {
    collection: jest.fn(() => collectionRef),
  };
  const firestoreFactory = () => firestoreInstance;

  firestoreFactory.FieldValue = {
    serverTimestamp: jest.fn(() => new Date()),
  };

  return firestoreFactory;
});

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({didCancel: true})),
}));
