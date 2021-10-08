import React from 'react';
import { Platform, Text, TouchableHighlight, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Region } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { Portal } from '@gorhom/portal';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import { color, font, layout } from 'src/constants';
import { useAppSelector } from 'src/hooks';
import { alertUnavailableFeature } from 'src/utilities';

import {
  DEFAULT_COORDINATES,
  MAX_SEARCH_RADIUS,
  MIN_SEARCH_RADIUS,
} from 'src/models/common';

import Spacer from '../Spacer';
import { Button } from '../buttons';

const ICON_SIZE = 22;
const ICON_PADDING = layout.spacing.md;
const ICON_DIAMETER = ICON_SIZE + ICON_PADDING;

// eslint-disable-next-line @typescript-eslint/ban-types
type LocationQueryBottomSheetProps = {};

const LocationQueryBottomSheet = React.forwardRef<
  BottomSheet,
  LocationQueryBottomSheetProps
>((props: LocationQueryBottomSheetProps, ref) => {
  const queryPrefs = useAppSelector(state => state.settings.locationQueryPrefs);
  const snapPoints = React.useMemo(() => ['95%'], []);

  const [searchRegion, setSearchRegion] = React.useState<Region>(() => ({
    ...(queryPrefs?.coordinates ?? DEFAULT_COORDINATES),
    latitudeDelta: 1.0,
    longitudeDelta: 1.0,
  }));

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => {
      return (
        <BottomSheetBackdrop
          {...props}
          opacity={0.25}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      );
    },
    [],
  );

  const handleCloseBottomSheet = () => {
    if (typeof ref === 'function') {
      console.warn('REF IS FUNCTION');
    } else {
      ref?.current?.close();
    }
  };

  return (
    <Portal>
      <BottomSheet
        ref={ref}
        index={-1}
        animateOnMount
        enablePanDownToClose
        // The following two lines are required to allow the Slider to respond
        // to gestures
        activeOffsetY={[-1, 1]}
        failOffsetX={[-5, 5]}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}>
        <LocationQueryBottomSheetHeader onPressClose={handleCloseBottomSheet} />
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: layout.spacing.lg }}>
          <View style={{ overflow: 'hidden', borderRadius: layout.radius.md }}>
            <MapView
              initialRegion={searchRegion}
              onRegionChange={setSearchRegion}
              style={{ height: 300 }}
            />
          </View>
          <Spacer.Vertical value={layout.spacing.md} />
          <Slider
            step={1}
            minimumValue={MIN_SEARCH_RADIUS}
            maximumValue={MAX_SEARCH_RADIUS}
            minimumTrackTintColor={color.accent}
            thumbTintColor={Platform.select({
              android: color.accent,
              default: undefined,
            })}
          />
        </BottomSheetScrollView>
        <View
          style={{
            flexDirection: 'row',
            paddingVertical: layout.spacing.lg,
            paddingHorizontal: layout.spacing.lg,
          }}>
          <Button
            title="Reset"
            type="secondary"
            variant="contained"
            onPress={() => alertUnavailableFeature()}
            containerStyle={{ flex: 1 }}
          />
          <Spacer.Horizontal value={layout.spacing.md} />
          <Button
            title="Apply"
            type="primary"
            variant="contained"
            onPress={() => alertUnavailableFeature()}
            containerStyle={{ flex: 1 }}
          />
        </View>
      </BottomSheet>
    </Portal>
  );
});

type LocationQueryBottomSheetHeaderProps = {
  onPressClose?: () => void;
};

function LocationQueryBottomSheetHeader(
  props: LocationQueryBottomSheetHeaderProps,
) {
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: layout.spacing.lg,
        paddingBottom: layout.spacing.md,
      }}>
      <TouchableHighlight
        underlayColor={color.gray200}
        onPress={props.onPressClose}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: ICON_DIAMETER,
          height: ICON_DIAMETER,
          borderRadius: ICON_DIAMETER / 2,
          backgroundColor: color.gray100,
        }}>
        <Icon name="close" size={ICON_SIZE} />
      </TouchableHighlight>
      <Text style={[font.largeBold, { flex: 1, textAlign: 'center' }]}>
        Search Location
      </Text>
      <Spacer.Horizontal value={ICON_DIAMETER} />
    </View>
  );
}

export default LocationQueryBottomSheet;
