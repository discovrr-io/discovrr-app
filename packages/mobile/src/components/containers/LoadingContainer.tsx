import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';
import Container, { ContainerProps } from './Container';

type LoadingContainerProps = ContainerProps & {
  message?: string;
};

export default function LoadingContainer({
  message = 'Loading…',
  ...props
}: LoadingContainerProps) {
  const { dark } = useExtendedTheme();
  return (
    <Container {...props}>
      <ActivityIndicator
        size="large"
        color={dark ? constants.color.gray300 : constants.color.gray700}
      />
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          constants.font.smallBold,
          loadingContainerStyles.message,
          { color: dark ? constants.color.gray300 : constants.color.gray700 },
        ]}>
        {message}
      </Text>
    </Container>
  );
}

const loadingContainerStyles = StyleSheet.create({
  message: {
    textAlign: 'center',
    marginTop: constants.layout.spacing.sm,
  },
});
