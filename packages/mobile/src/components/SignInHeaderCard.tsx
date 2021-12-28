import * as React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';
import { RootStackNavigationProp } from 'src/navigation';

import Spacer from './Spacer';
import Text from './Text';
import { Button } from './buttons';

type SignInHeaderCardProps = {
  style?: StyleProp<ViewStyle>;
};

export default function SignInHeaderCard(props: SignInHeaderCardProps) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { dark } = useExtendedTheme();

  const handlePressSignIn = () => {
    navigation.navigate('AuthPrompt', { screen: 'AuthStart' });
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePressSignIn}
      style={[
        signInCardStyles.card,
        {
          backgroundColor: dark
            ? constants.color.gray700
            : constants.color.gray500,
        },
        props.style,
      ]}>
      <View style={{ flex: 1 }}>
        <Text
          size="md"
          weight="bold"
          style={[{ flex: 1, color: constants.color.absoluteWhite }]}>
          You’re not signed in!
        </Text>
        <Spacer.Vertical value="xs" />
        <Text
          size="sm"
          style={[{ flex: 1, color: constants.color.absoluteWhite }]}>
          Don’t miss out on the benefits by signing in or creating an account
          with us today.
        </Text>
      </View>
      <Spacer.Horizontal value="lg" />
      <Button
        title="Sign In"
        variant="contained"
        size="medium"
        overrideTheme="light-content"
        onPress={handlePressSignIn}
        containerStyle={{ backgroundColor: constants.color.absoluteWhite }}
      />
    </TouchableOpacity>
  );
}

const signInCardStyles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: constants.layout.spacing.lg,
  },
});
