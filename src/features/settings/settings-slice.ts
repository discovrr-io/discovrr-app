import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { PersistPartial } from 'redux-persist/es/persistReducer';

import { AppSettings } from 'src/models';
import {
  AppearancePreferences,
  LocationQueryPreferences,
} from 'src/models/common';

//#region Settings State Initialization

export type SettingsState = AppSettings & PersistPartial;

const initialState: AppSettings = {
  locationQueryPrefs: undefined,
  appearancePrefs: 'system',
};

//#endregion Settings State Initialization

//#region Settings Slice

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSearchRadius: (state, action: PayloadAction<number>) => {
      const searchRadius = action.payload;
      if (state.locationQueryPrefs) {
        state.locationQueryPrefs.searchRadius = searchRadius;
      } else {
        state.locationQueryPrefs = { searchRadius };
      }
    },
    updateLocationQueryPrefs: (
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
    // updateSearchRadius: (state, action) => {
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
    updateAppearancePreference: (
      state,
      action: PayloadAction<AppearancePreferences>,
    ) => {
      state.appearancePrefs = action.payload;
    },
  },
});

export const {
  updateSearchRadius,
  updateLocationQueryPrefs,
  updateAppearancePreference,
} = settingsSlice.actions;

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
