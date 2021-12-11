import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import { Button, Spacer } from 'src/components';
import { color, font, layout } from 'src/constants';
import { useExtendedTheme } from 'src/hooks';

import {
  ReportItemStackScreenParams,
  RootStackNavigationProp,
} from 'src/navigation';

type ReportItemSuccessScreenProps =
  ReportItemStackScreenParams<'ReportItemReason'>;

export default function ReportItemSuccessScreen(
  props: ReportItemSuccessScreenProps,
) {
  const { colors } = useExtendedTheme();
  return (
    <SafeAreaView
      style={[
        layout.defaultScreenStyle,
        { flex: 1, alignContent: 'center', justifyContent: 'center' },
      ]}>
      <View style={{ alignItems: 'center' }}>
        <Icon name="checkmark-circle" color={color.green500} size={100} />
        <Spacer.Vertical value="xs" />
        <Text
          style={[font.largeBold, { textAlign: 'center', color: colors.text }]}>
          We&apos;ve received your report
        </Text>
        <Spacer.Vertical value="xs" />
        <Text
          style={[font.body, { textAlign: 'center', color: colors.caption }]}>
          We&apos;ll let you know of the outcome soon.
        </Text>
        <Spacer.Vertical value="md" />
        <Button
          title="Close"
          type="primary"
          variant="contained"
          size="small"
          onPress={() =>
            props.navigation.getParent<RootStackNavigationProp>().goBack()
          }
        />
      </View>
    </SafeAreaView>
  );
}
