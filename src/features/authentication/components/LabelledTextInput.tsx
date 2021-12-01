import * as React from 'react';
import { Text, View } from 'react-native';

import * as constants from 'src/constants';
import { Spacer, TextInput, TextInputProps } from 'src/components';
import { useExtendedTheme } from 'src/hooks';

type LabelledTextInputProps = TextInputProps & {
  label: string;
};

export default function LabelledTextInput(props: LabelledTextInputProps) {
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
      <TextInput {...restProps} />
    </View>
  );
}
