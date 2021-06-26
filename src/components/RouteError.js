import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../components';
import { colors, typography, values } from '../constants';

/**
 * @typedef {import('react-native').ViewProps} ViewProps
 * @typedef {{ emoji?: string, heading?: string, caption?: string }} RouteErrorProps
 * @param {RouteErrorProps & ViewProps} param0
 */
export default function RouteError({
  emoji = '😓',
  heading = `Something went wrong`,
  caption = "The link you provided doesn't seem to be valid.",
}) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={[errorStyles.container]}>
        <Text style={[errorStyles.emoji]}>{emoji}</Text>
        <Text style={[errorStyles.heading]}>{heading}</Text>
        <Text style={[errorStyles.caption]}>{caption}</Text>
        <Button
          primary
          size="small"
          title="Take Me Back"
          onPress={() => navigation.goBack()}
          style={[errorStyles.button]}
        />
      </View>
    </SafeAreaView>
  );
}

const commonErrorStyles = {
  textAlign: 'center',
};

const errorStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: values.spacing.xxl,
  },
  emoji: {
    ...commonErrorStyles,
    fontSize: typography.size.h2 * 1.5,
    textAlign: 'center',
  },
  heading: {
    ...commonErrorStyles,
    fontSize: typography.size.h4,
    fontWeight: '600',
    marginTop: values.spacing.sm,
    marginBottom: values.spacing.md,
  },
  caption: {
    ...commonErrorStyles,
    fontSize: typography.size.md,
  },
  button: {
    marginTop: values.spacing.md * 1.5,
    width: '50%',
  },
});
