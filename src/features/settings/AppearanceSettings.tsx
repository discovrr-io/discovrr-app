import * as React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

import * as constants from 'src/constants';
import * as settingsSlice from 'src/features/settings/settings-slice';
import { Cell } from 'src/components';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { RootStackScreenProps } from 'src/navigation';
import { AppearancePreferences } from 'src/models/common';

type AppearanceSettingsScreenProps = RootStackScreenProps<'AppearanceSettings'>;

export default function AppearanceSettingsScreen(
  _: AppearanceSettingsScreenProps,
) {
  const dispatch = useAppDispatch();
  const appearance = useAppSelector(state => state.settings.appearancePrefs);

  const handleChangeAppearancePrefs = (value: string) => {
    console.log('Setting appearance preference to:', value);
    const selectedValue = value as AppearancePreferences;

    dispatch(settingsSlice.updateAppearancePreference(selectedValue));
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={constants.layout.defaultScreenStyle}>
        <Cell.Group label="App Theme">
          <Cell.OptionGroup
            value={appearance}
            onValueChanged={handleChangeAppearancePrefs}>
            <Cell.Option
              label="Follow System"
              value="system"
              caption="Automatically changes the theme to match your device's current theme"
            />
            <Cell.Option label="Light" value="light" />
            <Cell.Option label="Dark" value="dark" />
            {__DEV__ && <Cell.Option label="Debug" value="debug" />}
          </Cell.OptionGroup>
        </Cell.Group>
      </ScrollView>
    </SafeAreaView>
  );
}
