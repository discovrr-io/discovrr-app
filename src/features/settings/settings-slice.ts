import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { PersistPartial } from 'redux-persist/es/persistReducer';

import { AppSettings } from 'src/models';
import { LocationQueryPreferences } from 'src/models/common';

//#region Settings State Initialization

export type SettingsState = AppSettings & PersistPartial;

const initialState: AppSettings = {
  locationQueryPrefs: undefined,
};

//#endregion Settings State Initialization

//#region Settings Slice

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    didUpdateSearchRadius: (state, action: PayloadAction<number>) => {
      const searchRadius = action.payload;
      if (state.locationQueryPrefs) {
        state.locationQueryPrefs.searchRadius = searchRadius;
      } else {
        state.locationQueryPrefs = { searchRadius };
      }
    },
    didUpdateLocationQueryPrefs: (
      state,
      action: PayloadAction<LocationQueryPreferences>,
    ) => {
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

//#endregion Settings Slice

// Don't persist `locationQueryPrefs`
export default persistReducer(
  {
    key: 'settings',
    storage: AsyncStorage,
    blacklist: ['locationQueryPrefs'],
  },
  settingsSlice.reducer,
);
