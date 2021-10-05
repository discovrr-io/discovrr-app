import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { Spacer } from 'src/components';
import { color, font, layout } from 'src/constants';

type FeedFooterProps = {
  didReachEnd?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function FeedFooter(props: FeedFooterProps) {
  return (
    <View style={[styles.container, props.style]}>
      {props.didReachEnd ? (
        <Text style={[font.largeBold, { textAlign: 'center' }]}>
          You&apos;re all caught up!
        </Text>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator color={color.gray700} />
          <Spacer.Horizontal value={layout.spacing.md} />
          <Text style={[font.largeBold]}>Loading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: layout.spacing.lg,
  },
});
