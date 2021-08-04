import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
} from 'react-native';

import { colors, DEFAULT_ACTIVE_OPACITY, typography } from '../constants';
import { SOMETHING_WENT_WRONG } from '../constants/strings';
import { Coordinates } from '../models/common';

type LocationLabelProps = {
  label: string;
  coordinates: Coordinates;
  coordinatesLabel?: string;
  styles?: StyleProp<TextStyle>;
};

export default function LocationLabel(props: LocationLabelProps) {
  const $FUNC = '[LocationText]';
  const {
    label,
    coordinates: { latitude, longitude },
    coordinatesLabel = label,
    styles,
  } = props;

  const handleOpenMapLink = async () => {
    try {
      const scheme = Platform.OS === 'ios' ? 'maps:0,0?q=' : 'geo:0,0?q=';
      const latitudeLongitude = `${latitude},${longitude}`;
      const mapUrl = Platform.select({
        ios: `${scheme}${coordinatesLabel}@${latitudeLongitude}`,
        android: `${scheme}${latitudeLongitude}(${coordinatesLabel})`,
      });

      console.log($FUNC, `Opening url '${mapUrl}'...`);
      await Linking.openURL(mapUrl);
    } catch (error) {
      console.error($FUNC, 'Failed to open map link:', error);
      Alert.alert(
        SOMETHING_WENT_WRONG.title,
        "We weren't able to open this link for you.",
      );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      onPress={handleOpenMapLink}>
      <Text style={[locationLabelStyles.label, styles]}>{label}</Text>
    </TouchableOpacity>
  );
}

const locationLabelStyles = StyleSheet.create({
  label: {
    color: colors.black,
    fontSize: typography.size.md,
  },
});
