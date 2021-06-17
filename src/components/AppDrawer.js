import React from 'react';
import { SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import FastImage from 'react-native-fast-image';
// import { useNavigation } from '@react-navigation/native';

const AVATAR_DIAMETER = 100;
const DEFAULT_ACTIVE_OPACITY = 0.8;

export default function AppDrawer() {
  // const navigation = useNavigation();

  /** @type {import('../features/authentication/authSlice').AuthState} */
  const {
    user: { profile },
  } = useSelector((state) => state.auth);

  return (
    <SafeAreaView>
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        // onPress={navigation.navigate('ProfileEditScreen')}
      >
        <FastImage
          source={{ uri: profile.avatar.url }}
          resizeMode="cover"
          style={{
            width: AVATAR_DIAMETER,
            height: AVATAR_DIAMETER,
            borderRadius: AVATAR_DIAMETER / 2,
          }}
        />
      </TouchableOpacity>

      <Text>{JSON.stringify(profile)}</Text>
    </SafeAreaView>
  );
}
