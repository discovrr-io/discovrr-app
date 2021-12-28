import React from 'react';

import { Provider } from 'react-redux';
import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import { render, RenderOptions } from '@testing-library/react-native';
import '@testing-library/jest-dom';

/* eslint-disable */
// @ts-ignore
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
/* eslint-enable */

import { rootReducer } from './store';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  preloadedState?: ConfigureStoreOptions['preloadedState'];
  store?: ReturnType<typeof configureStore>;
};

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) => {
  const { preloadedState, store, ...renderOptions } = options;
  const configuredStore =
    store ?? configureStore({ reducer: rootReducer, preloadedState });

  const Wrapper: React.FC = ({ children }) => (
    <Provider store={configuredStore}>{children}</Provider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react-native';
export { customRender as render };
