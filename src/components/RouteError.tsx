import React from 'react';
import { SafeAreaView, StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { RootStackNavigationProp } from 'src/navigation';

import ErrorContainer, {
  ErrorContainerProps,
} from './containers/ErrorContainer';

type RouteErrorProps = ErrorContainerProps & {
  containerStyle?: StyleProp<ViewStyle>;
};

export default function RouteError(props: RouteErrorProps) {
  const navigation = useNavigation<RootStackNavigationProp>();
  return (
    <SafeAreaView style={[{ flex: 1 }, props.containerStyle]}>
      <ErrorContainer
        message="The link you gave is invalid. Please try again later."
        actionTitle="Take Me Back"
        actionButtonType="primary"
        actionOnPress={() => navigation.goBack()}
        {...props}
      />
    </SafeAreaView>
  );
}
