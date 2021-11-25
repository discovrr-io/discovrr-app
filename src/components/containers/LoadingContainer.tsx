import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { color, font, layout } from 'src/constants';
import Container, { ContainerProps } from './Container';

type LoadingContainerProps = ContainerProps & {
  message?: string;
};

export default function LoadingContainer({
  message = 'Loading…',
  ...props
}: LoadingContainerProps) {
  return (
    <Container {...props}>
      <ActivityIndicator size="large" color={color.gray500} />
      <Text style={[font.smallBold, loadingContainerStyles.message]}>
        {message}
      </Text>
    </Container>
  );
}

const loadingContainerStyles = StyleSheet.create({
  message: {
    textAlign: 'center',
    color: color.gray700,
    marginTop: layout.spacing.sm,
  },
});
