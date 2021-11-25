import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { color, font, layout } from 'src/constants';
import Container, { ContainerProps } from './Container';

import { Button } from '../buttons';
import { ButtonType } from '../buttons/buttonStyles';

export type InfoContainerProps = ContainerProps & {
  emoji?: string;
  title?: string;
  message?: string;
  actionTitle?: string;
  actionButtonType?: ButtonType;
  actionOnPress?: () => void;
};

export default function InfoContainer(props: InfoContainerProps) {
  const {
    emoji,
    title,
    message,
    actionTitle,
    actionButtonType,
    actionOnPress,
    ...restProps
  } = props;

  const { dark, colors } = useTheme();

  return (
    <Container {...restProps}>
      {emoji && (
        <Text style={[emptyContainerProps.emoji, { color: colors.text }]}>
          {emoji}
        </Text>
      )}
      {title && (
        <Text style={[emptyContainerProps.title, { color: colors.text }]}>
          {title}
        </Text>
      )}
      {message && (
        <Text
          style={[
            emptyContainerProps.message,
            { color: dark ? color.gray300 : color.gray700 },
          ]}>
          {message}
        </Text>
      )}
      {actionTitle && (
        <Button
          size="small"
          variant="contained"
          type={actionButtonType}
          title={actionTitle}
          onPress={actionOnPress}
          containerStyle={{ marginTop: layout.spacing.md }}
        />
      )}
    </Container>
  );
}

const emptyContainerProps = StyleSheet.create({
  emoji: {
    ...(Platform.OS === 'ios' ? font.h2 : font.h3),
    textAlign: 'center',
  },
  title: {
    ...font.mediumBold,
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? layout.spacing.sm : 0,
  },
  message: {
    ...font.small,
    textAlign: 'center',
    marginTop: layout.spacing.sm,
  },
});
