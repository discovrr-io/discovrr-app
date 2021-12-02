import * as React from 'react';
import { Text, View } from 'react-native';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';

import Spacer from '../Spacer';
import { TextInputProps } from './TextInput';

type LabelledInputProps = TextInputProps & {
  label: string;
};

export const withLabelledVariant =
  (WrappedComponent: React.ComponentType<TextInputProps>) =>
  (props: LabelledInputProps) => {
    const { label, ...restProps } = props;
    const { colors } = useExtendedTheme();

    return (
      <View>
        <Text
          maxFontSizeMultiplier={1.2}
          style={[
            constants.font.small,
            { color: colors.text, paddingLeft: constants.layout.spacing.sm },
          ]}>
          {label}
        </Text>
        <Spacer.Vertical value="sm" />
        <WrappedComponent {...restProps} />
      </View>
    );
  };

export const withFormikVariant =
  (WrappedComponent: React.ComponentType<TextInputProps>) =>
  (props: TextInputProps) => {
    return null;
  };
