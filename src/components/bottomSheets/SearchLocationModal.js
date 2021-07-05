import React, { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import Slider from '@react-native-community/slider';
import MapView from 'react-native-maps';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
// import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';

import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { Button, TextInput } from '../../components';
import { colors, typography, values } from '../../constants';

import {
  didUpdateLocationQueryPrefs,
  didUpdateSearchRadius,
} from '../../features/settings/settingsSlice';

import {
  DEFAULT_SEARCH_RADIUS,
  DEFAULT_COORDINATES,
  MIN_SEARCH_RADIUS,
  MAX_SEARCH_RADIUS,
} from '../../models/common';

/**
 * @typedef {import('@gorhom/bottom-sheet').BottomSheetBackdropProps} BottomSheetBackdropProps
 * @param {BottomSheetBackdropProps} param0
 */
function SearchLocationModalBackdrop({ animatedIndex, style }) {
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0, 0.75],
      [0, 0.75],
      Extrapolate.CLAMP,
    ),
  }));

  const containerStyle = useMemo(
    () => [style, { backgroundColor: colors.black }, containerAnimatedStyle],
    [style, containerAnimatedStyle],
  );

  return <Animated.View style={containerStyle} />;
}

const SearchLocationModal = React.forwardRef(
  /**
   * @typedef {import('@gorhom/bottom-sheet').BottomSheetProps} BottomSheetProps
   * @param {Omit<BottomSheetProps, 'snapPoints' | 'backdropComponent'>} props
   * @param {React.ForwardedRef<BottomSheetModal} ref
   */
  (props, ref) => {
    const dispatch = useDispatch();

    const snapPoints = useMemo(() => ['80%'], []);

    /** @type {import('../../models').AppSettings} */
    const { locationQueryPrefs } = useSelector((state) => state.settings);

    const [searchRegion, setSearchRegion] = useState({
      ...(locationQueryPrefs?.coordinates ?? DEFAULT_COORDINATES),
      latitudeDelta: 1.0,
      longitudeDelta: 1.0,
    });

    const [searchRadiusValue, setSearchRadiusValue] = useState(
      locationQueryPrefs?.searchRadius ?? MIN_SEARCH_RADIUS,
    );

    const handleApplyChanges = () => {
      const updateAction = didUpdateLocationQueryPrefs({
        searchRadius: searchRadiusValue,
        coordinates: {
          latitude: searchRegion.latitude,
          longitude: searchRegion.longitude,
        },
      });

      dispatch(updateAction);
      ref.current?.dismiss();
    };

    const handleResetChanges = () => {
      const resetLocationQuery = () => {
        // const resetAction = didUpdateLocationQueryPrefs({
        //   searchRadius: DEFAULT_SEARCH_RADIUS,
        //   coordinates: DEFAULT_COORDINATES,
        // });

        const resetAction = didUpdateSearchRadius(DEFAULT_SEARCH_RADIUS);
        dispatch(resetAction);
        ref.current?.dismiss();
      };

      Alert.alert(
        'Reset Search Location?',
        'Are you sure you want to reset the search location and radius?',
        [
          { text: 'Reset', style: 'destructive', onPress: resetLocationQuery },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    };

    return (
      <BottomSheetModal
        ref={ref}
        {...props}
        snapPoints={snapPoints}
        backdropComponent={SearchLocationModalBackdrop}>
        <View
          style={{
            flex: 1,
            marginTop: values.spacing.lg,
            marginHorizontal: values.spacing.xl,
            marginBottom: values.spacing.xl,
          }}>
          <View>
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: values.spacing.lg,
              }}>
              Adjust Search Location
            </Text>
            <View
              style={{ borderBottomWidth: 1, borderColor: colors.gray200 }}
            />
          </View>
          <View
            style={{
              flexGrow: 1,
              justifyContent: 'space-between',
            }}>
            <View style={{ flexGrow: 1, marginVertical: values.spacing.lg }}>
              <TextInput
                placeholder="Search a location..."
                style={{ marginBottom: values.spacing.lg }}
              />
              {/* <NativeViewGestureHandler> */}
              <MapView
                initialRegion={searchRegion}
                // region={searchRegion}
                onRegionChange={setSearchRegion}
                style={{ flexGrow: 1 }}
              />
              {/* </NativeViewGestureHandler> */}
            </View>
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text style={searchLocationModalStyles.sliderTextIndicator}>
                  {MIN_SEARCH_RADIUS}km
                </Text>
                <Text
                  style={[
                    searchLocationModalStyles.sliderTextIndicator,
                    {
                      fontWeight: '700',
                      fontSize: typography.size.lg,
                    },
                  ]}>
                  {searchRadiusValue}km
                </Text>
                <Text style={searchLocationModalStyles.sliderTextIndicator}>
                  {MAX_SEARCH_RADIUS}km
                </Text>
              </View>
              {/* <NativeViewGestureHandler> */}
              <Slider
                step={1}
                minimumValue={MIN_SEARCH_RADIUS}
                maximumValue={MAX_SEARCH_RADIUS}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.gray200}
                value={searchRadiusValue}
                onValueChange={setSearchRadiusValue}
                {...(Platform.OS === 'android' && {
                  thumbTintColor: colors.accent,
                })}
                style={[
                  Platform.OS === 'android' && {
                    marginTop: values.spacing.md * 1.5,
                    marginBottom: values.spacing.xl,
                  },
                  Platform.OS === 'ios' && {
                    marginTop: values.spacing.sm,
                    marginBottom: values.spacing.lg,
                  },
                ]}
              />
              {/* </NativeViewGestureHandler> */}
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
            }}>
            <Button
              title="Reset"
              onPress={handleResetChanges}
              style={{ flexGrow: 1, marginRight: values.spacing.md }}
            />
            <Button
              primary
              title="Apply"
              onPress={handleApplyChanges}
              style={{ flexGrow: 1 }}
            />
          </View>
        </View>
      </BottomSheetModal>
    );
  },
);

const searchLocationModalStyles = StyleSheet.create({
  sliderTextIndicator: {
    color: colors.gray700,
    textAlign: 'center',
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
});

export default SearchLocationModal;
