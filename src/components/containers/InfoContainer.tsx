import * as React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import * as constants from 'src/constants';
import Container, { ContainerProps } from './Container';

import { Button } from '../buttons';
import { useExtendedTheme } from 'src/hooks';
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

  const { colors } = useExtendedTheme();

  return (
    <Container {...restProps}>
      {emoji && (
        <Text
          maxFontSizeMultiplier={1.2}
          style={[emptyContainerProps.emoji, { color: colors.text }]}>
          {emoji}
        </Text>
      )}
      {title && (
        <Text
          maxFontSizeMultiplier={1.2}
          style={[emptyContainerProps.title, { color: colors.text }]}>
          {title}
        </Text>
      )}
      {message && (
        <Text
          maxFontSizeMultiplier={1.2}
          style={[emptyContainerProps.message, { color: colors.caption }]}>
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
          containerStyle={{ marginTop: constants.layout.spacing.md }}
        />
      )}
    </Container>
  );
}

const emptyContainerProps = StyleSheet.create({
  emoji: {
    ...(Platform.OS === 'ios' ? constants.font.h2 : constants.font.h3),
    textAlign: 'center',
  },
  title: {
    ...constants.font.bodyBold,
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? constants.layout.spacing.sm : 0,
  },
  message: {
    ...constants.font.small,
    textAlign: 'center',
    marginTop: constants.layout.spacing.sm,
  },
});
