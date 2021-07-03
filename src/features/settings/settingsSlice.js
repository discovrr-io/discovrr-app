import { createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {import('../../models').AppSettings} [AppSettings
 * @type {AppSettings}
 */
const initialState = {
  locationSettings: {},
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
        if (state.locationSettings) {
          state.locationSettings.searchRadius = searchRadius;
        } else {
          state.locationSettings = { searchRadius };
        }
      },
    didUpdateLocationQueryPreferences:
      /**
       * @typedef {import('../../models/common').LocationQueryPreferences} LocationQueryPreferences
       * @typedef {import('@reduxjs/toolkit').PayloadAction<LocationQueryPreferences>} LocationQueryPreferencesPayloadAction
       * @param {import('../../models').AppSettings} state
       * @param {LocationQueryPreferencesPayloadAction} action
       */
      (state, action) => {
        const newSettings = action.payload;
        // const locationSettings = state.locationSettings;
        if (state.locationSettings) {
          state.locationSettings = newSettings;
        } else {
          state.locationSettings = { ...newSettings };
        }
      },
    // didUpdateSearchRadius: (state, action) => {
    //   const { searchRadius } = action.payload;
    //   const locationSettings = state.locationSettings;
    //   if (locationSettings) {
    //     locationSettings.searchRadius = searchRadius;
    //   } else {
    //     locationSettings = { searchRadius };
    //   }
    // },
    // didUpdateSearchCoordinates: (state, action) => {
    //   const { coordinates } = action.payload;
    //   const locationSettings = state.locationSettings;
    //   if (locationSettings) {
    //     locationSettings.coordinates = coordinates;
    //   } else {
    //     locationSettings = { coordinates };
    //   }
    // },
  },
});

export const { didUpdateSearchRadius, didUpdateLocationQueryPreferences } =
  settingsSlice.actions;

export default settingsSlice.reducer;
