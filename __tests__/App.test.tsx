/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../App', () => {
  const MockedReact = require('react');

  function MockApp() {
    return MockedReact.createElement('MockApp');
  }

  return MockApp;
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
