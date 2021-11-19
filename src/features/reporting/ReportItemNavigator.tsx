import React from 'react';
import { Platform } from 'react-native';

import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';

import ReportItemReasonScreen from './ReportItemReasonScreen';
import ReportItemSuccessScreen from './ReportItemSuccessScreen';
import { HeaderIcon } from 'src/components';
import { color, font, layout } from 'src/constants';

import {
  ReportItemStackNavigationProp,
  ReportItemStackParamList,
  RootStackNavigationProp,
} from 'src/navigation';

const ReportItemStack = createStackNavigator<ReportItemStackParamList>();

export default function ReportItemNavigator() {
  return (
    <ReportItemStack.Navigator
      initialRouteName="ReportItemReason"
      screenOptions={({
        navigation,
      }: {
        navigation: ReportItemStackNavigationProp;
      }) => ({
        title: 'Report',
        headerTintColor: color.black,
        headerBackTitleVisible: false,
        headerTitleStyle: font.defaultHeaderTitleStyle,
        headerLeft: props => (
          <HeaderIcon.Close
            {...props}
            onPress={() => {
              navigation.getParent<RootStackNavigationProp>().goBack();
            }}
          />
        ),
        headerLeftContainerStyle: {
          paddingLeft: layout.defaultScreenMargins.horizontal,
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
