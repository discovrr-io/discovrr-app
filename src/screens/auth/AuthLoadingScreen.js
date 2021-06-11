import React from 'react';

import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { connect, useDispatch } from 'react-redux';

import LoginScreen from './LoginScreen';
import GroundZero from '../../GroundZero';

const AuthStack = createStackNavigator();
const MainDrawer = createDrawerNavigator();

function AuthLoadingScreen({ isAuthenticated }) {
  const dispatch = useDispatch();

  console.log('[AuthLoadingScreen]: isAuthenticated:', isAuthenticated);

  return isAuthenticated ? (
    <MainDrawer.Navigator>
      <MainDrawer.Screen name="GroundZero" component={GroundZero} />
    </MainDrawer.Navigator>
  ) : (
    <AuthStack.Navigator headerMode="none">
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

const mapStateToProps = (state) => {
  const { userState } = state;

  return {
    isAuthenticated: userState.isLoggedIn === 'signedIn',
  };
};

export default connect(mapStateToProps)(AuthLoadingScreen);
