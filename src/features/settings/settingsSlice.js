import { createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {import('../../models').AppSettings} AppSettings
 * @type {AppSettings}
 */
const initialState = {
  locationQueryPrefs: undefined,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    didUpdateSearchRadius:
      /**
       * @typedef {import('@reduxjs/toolkit').PayloadAction<number>} PayloadAction
       * @param {import('../../models').AppSettings} state
       * @param {PayloadAction} action
       */
      (state, action) => {
        const searchRadius = action.payload;
        if (state.locationQueryPrefs) {
          state.locationQueryPrefs.searchRadius = searchRadius;
        } else {
          state.locationQueryPrefs = { searchRadius };
        }
      },
    didUpdateLocationQueryPrefs:
      /**
       * @typedef {import('../../models/common').LocationQueryPreferences} LocationQueryPreferences
       * @typedef {import('@reduxjs/toolkit').PayloadAction<LocationQueryPreferences>} LocationQueryPreferencesPayloadAction
       * @param {import('../../models').AppSettings} state
       * @param {LocationQueryPreferencesPayloadAction} action
       */
      (state, action) => {
        const newSettings = action.payload;
        // const locationQueryPrefs = state.locationQueryPrefs;
        if (state.locationQueryPrefs) {
          state.locationQueryPrefs = newSettings;
        } else {
          state.locationQueryPrefs = { ...newSettings };
        }
      },
    // didUpdateSearchRadius: (state, action) => {
    //   const { searchRadius } = action.payload;
    //   const locationQueryPrefs = state.locationQueryPrefs;
    //   if (locationQueryPrefs) {
    //     locationQueryPrefs.searchRadius = searchRadius;
    //   } else {
    //     locationQueryPrefs = { searchRadius };
    //   }
    // },
    // didUpdateSearchCoordinates: (state, action) => {
    //   const { coordinates } = action.payload;
    //   const locationQueryPrefs = state.locationQueryPrefs;
    //   if (locationQueryPrefs) {
    //     locationQueryPrefs.coordinates = coordinates;
    //   } else {
    //     locationQueryPrefs = { coordinates };
    //   }
    // },
  },
});

export const { didUpdateSearchRadius, didUpdateLocationQueryPrefs } =
  settingsSlice.actions;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer } from 'redux-persist';

// Don't persist `locationQueryPrefs`
export default persistReducer(
  {
    key: 'settings',
    storage: AsyncStorage,
    blacklist: ['locationQueryPrefs'],
  },
  settingsSlice.reducer,
);
