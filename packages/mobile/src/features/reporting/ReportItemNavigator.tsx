import React from 'react';
import { Platform } from 'react-native';

import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';

import * as constants from 'src/constants';
import { HeaderIcon } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import {
  ReportItemStackNavigationProp,
  ReportItemStackParamList,
  RootStackNavigationProp,
} from 'src/navigation';

import ReportItemReasonScreen from './ReportItemReasonScreen';
import ReportItemSuccessScreen from './ReportItemSuccessScreen';

const ReportItemStack = createStackNavigator<ReportItemStackParamList>();

export default function ReportItemNavigator() {
  const { colors } = useExtendedTheme();
  return (
    <ReportItemStack.Navigator
      initialRouteName="ReportItemReason"
      screenOptions={({
        navigation,
      }: {
        navigation: ReportItemStackNavigationProp;
      }) => ({
        title: 'Report',
        headerTintColor: colors.text,
        headerBackTitleVisible: false,
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerLeft: props => (
          <HeaderIcon.Close
            {...props}
            onPress={() => {
              navigation.getParent<RootStackNavigationProp>().goBack();
            }}
          />
        ),
        headerLeftContainerStyle: {
          paddingLeft: constants.layout.defaultScreenMargins.horizontal,
        },
      })}>
      <ReportItemStack.Screen
        name="ReportItemReason"
        component={ReportItemReasonScreen}
      />
      <ReportItemStack.Screen
        name="ReportItemSuccess"
        component={ReportItemSuccessScreen}
        options={{
          cardStyleInterpolator: Platform.select({
            android: CardStyleInterpolators.forFadeFromCenter,
          }),
        }}
      />
    </ReportItemStack.Navigator>
  );
}
