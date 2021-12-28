import * as React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import * as constants from 'src/constants';
import { Spacer } from 'src/components';
import { useExtendedTheme } from 'src/hooks';

type FeedFooterProps = {
  didReachEnd?: boolean;
  message?: string;
  style?: StyleProp<ViewStyle>;
};

export default function FeedFooter(props: FeedFooterProps) {
  const { colors } = useExtendedTheme();
  return (
    <View style={[styles.container, props.style]}>
      {props.didReachEnd ? (
        <Text
          style={[
            constants.font.largeBold,
            { textAlign: 'center', color: colors.text },
          ]}>
          {props.message || 'You’re all caught up!'}
        </Text>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator color={constants.color.gray700} />
          <Spacer.Horizontal value={constants.layout.spacing.md} />
          <Text style={[constants.font.largeBold, { color: colors.text }]}>
            Loading...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: constants.layout.spacing.lg,
  },
});
