import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { colors, typography, values } from './constants';

const Parse = require('parse/react-native');

export default function AccountSettingsScreen() {
  useEffect(() => {}, []);

  return (
    <ScrollView contentContainerStyle={accountSettingsScreenStyles.container}>
      <Text style={accountSettingsScreenStyles.section}>
        Login and Security
      </Text>
      <TextInput
        placeholder="Full Name"
        style={accountSettingsScreenStyles.textInput}
      />
      <TextInput
        placeholder="Username"
        style={accountSettingsScreenStyles.textInput}
      />
      <TextInput
        placeholder="Email"
        style={accountSettingsScreenStyles.textInput}
      />
    </ScrollView>
  );
}

const accountSettingsScreenStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: values.spacing.lg,
    backgroundColor: colors.white,
  },
  section: {
    fontSize: typography.size.h4,
    marginBottom: values.spacing.lg,
  },
  textInput: {
    borderBottomWidth: 1,
    borderColor: colors.gray500,
    backgroundColor: colors.gray100,
    marginBottom: values.spacing.lg,
    height: values.buttonSizes.large,
    padding: values.spacing.md,
  },
});
