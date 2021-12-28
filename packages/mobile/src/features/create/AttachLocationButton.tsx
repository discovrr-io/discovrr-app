import React from 'react';
import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  Text,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';

import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/Ionicons';

import { Spacer } from 'src/components';
import { color, font, layout } from 'src/constants';

async function hasPermissionIOS(): Promise<boolean> {
  const status = await Geolocation.requestAuthorization('whenInUse');

  if (status === 'granted') {
    return true;
  }

  if (status === 'denied') {
    Alert.alert('You have denied location permissions');
  }

  if (status === 'disabled') {
    Alert.alert(
      `Turn on Location Services to allow "Discovrr" to determine your location.`,
      undefined,
      [
        {
          text: 'Go to Settings',
          onPress: () =>
            Linking.openSettings().catch(() =>
              Alert.alert('Unable to open settings', 'Please try again later.'),
            ),
        },
        { text: "Don't Use Location", onPress: () => {} },
      ],
    );
  }

  return false;
}

async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return await hasPermissionIOS();
  }

  if (Platform.OS === 'android' && Platform.Version < 23) {
    return true;
  }

  const hasPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  if (status === PermissionsAndroid.RESULTS.GRANTED) {
    return true;
  }

  if (status === PermissionsAndroid.RESULTS.DENIED) {
    ToastAndroid.show('Location permission denied by user.', ToastAndroid.LONG);
  } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    ToastAndroid.show(
      'Location permission revoked by user.',
      ToastAndroid.LONG,
    );
  }

  return false;
}

export default function AttachLocationButton() {
  const [location, setLocation] =
    React.useState<Geolocation.GeoPosition | null>(null);

  React.useEffect(() => {
    return () => {
      console.log('Stopping Geolocation observation…');
      Geolocation.stopObserving();
    };
  }, []);

  const getCurrentLocation = async () => {
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      position => {
        console.log('CURRENT LOCATION:', position);
        setLocation(position);
      },
      error => {
        console.error('ERROR:', error);
        Alert.alert('Failed to get current location', error.message);
        setLocation(null);
      },
      {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  return (
    <TouchableOpacity
      onPress={getCurrentLocation}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: layout.spacing.md,
      }}>
      <Icon name="location" size={24} color={color.black} />
      <Spacer.Horizontal value={layout.spacing.sm} />
      <Text style={[font.body]}>
        {location
          ? `(${location.coords.latitude},${location.coords.longitude})`
          : 'Get my current location…'}
      </Text>
    </TouchableOpacity>
  );
}
