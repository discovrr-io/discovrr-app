import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
// import MapView, { Region } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { Portal } from '@gorhom/portal';
import { BlurView } from '@react-native-community/blur';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  useBottomSheet,
} from '@gorhom/bottom-sheet';

import { color, font, layout } from 'src/constants';
import { useAppSelector, useExtendedTheme } from 'src/hooks';
import { alertUnavailableFeature } from 'src/utilities';

import {
  // DEFAULT_COORDINATES,
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
>((_props: LocationQueryBottomSheetProps, ref) => {
  const _ = useAppSelector(state => state.settings.locationQueryPrefs);
  const snapPoints = React.useMemo(() => ['95%'], []);
  const { colors } = useExtendedTheme();

  // const [searchRegion, setSearchRegion] = React.useState<Region>(() => ({
  //   ...(queryPrefs?.coordinates ?? DEFAULT_COORDINATES),
  //   latitudeDelta: 1.0,
  //   longitudeDelta: 1.0,
  // }));

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
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.text }}
        backgroundStyle={{ backgroundColor: colors.card }}>
        <LocationQueryBottomSheetContent />
      </BottomSheet>
    </Portal>
  );
});

const bottomSheetStyles = StyleSheet.create({
  scrollView: {
    paddingHorizontal: layout.spacing.lg,
  },
  mapView: {
    overflow: 'hidden',
    borderRadius: layout.radius.md,
  },
  buttonFooterContainer: {
    flexDirection: 'row',
    paddingVertical: layout.spacing.lg,
    paddingHorizontal: layout.spacing.lg,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

function LocationQueryBottomSheetContent() {
  const { dark, colors } = useExtendedTheme();
  const { close } = useBottomSheet();

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
      <LocationQueryBottomSheetHeader onPressClose={close} />
      <BottomSheetScrollView
        contentContainerStyle={bottomSheetStyles.scrollView}>
        <View style={bottomSheetStyles.mapView}>
          {/* <MapView
              initialRegion={searchRegion}
              onRegionChange={setSearchRegion}
              style={{ height: 300 }}
            /> */}
          <View style={{ width: 300, backgroundColor: colors.placeholder }} />
        </View>
        <Spacer.Vertical value="md" />
        <Slider
          step={1}
          minimumValue={MIN_SEARCH_RADIUS}
          maximumValue={MAX_SEARCH_RADIUS}
          minimumTrackTintColor={color.accent}
          thumbTintColor={Platform.select({ android: color.accent })}
        />
      </BottomSheetScrollView>
      <View style={bottomSheetStyles.buttonFooterContainer}>
        <Button
          title="Reset"
          type="secondary"
          variant="contained"
          onPress={() => alertUnavailableFeature()}
          containerStyle={{ flex: 1 }}
        />
        <Spacer.Horizontal value="md" />
        <Button
          title="Apply"
          type="primary"
          variant="contained"
          onPress={() => alertUnavailableFeature()}
          containerStyle={{ flex: 1 }}
        />
      </View>
      <BlurView
        blurType={dark ? 'dark' : 'light'}
        blurRadius={20}
        style={bottomSheetStyles.blurView}
      />
      <View
        style={[
          bottomSheetStyles.blurView,
          {
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: layout.spacing.xl,
          },
        ]}>
        <Text
          style={[font.largeBold, { textAlign: 'center', color: colors.text }]}>
          Feature Not Available Yet
        </Text>
        <Spacer.Vertical value="xs" />
        <Text
          style={[font.medium, { textAlign: 'center', color: colors.text }]}>
          We&apos;re still working on this feature. We&apos;ll let you know when
          it&apos;s ready.
        </Text>
        <Spacer.Vertical value="md" />
        <Button
          title="Close"
          type="primary"
          size="small"
          variant="contained"
          onPress={() => close()}
        />
      </View>
    </SafeAreaView>
  );
}

type LocationQueryBottomSheetHeaderProps = {
  onPressClose?: () => void;
};

function LocationQueryBottomSheetHeader(
  props: LocationQueryBottomSheetHeaderProps,
) {
  const { colors } = useExtendedTheme();
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: layout.spacing.lg,
        paddingBottom: layout.spacing.md,
      }}>
      <TouchableHighlight
        underlayColor={colors.highlight}
        onPress={props.onPressClose}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: ICON_DIAMETER,
          height: ICON_DIAMETER,
          borderRadius: ICON_DIAMETER / 2,
          backgroundColor: colors.background,
        }}>
        <Icon name="close" size={ICON_SIZE} />
      </TouchableHighlight>
      <Text
        style={[
          font.largeBold,
          { flex: 1, textAlign: 'center', color: colors.text },
        ]}>
        Search Location
      </Text>
      <Spacer.Horizontal value={ICON_DIAMETER} />
    </View>
  );
}

export default LocationQueryBottomSheet;
