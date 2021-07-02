import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import Slider from '@react-native-community/slider';
import MapView from 'react-native-maps';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useDispatch, useSelector } from 'react-redux';

import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { Button, TextInput } from '../../components';
import { colors, typography, values } from '../../constants';
import { didUpdateLocationQueryPreferences } from '../../features/settings/settingsSlice';
import { DEFAULT_COORDINATES } from '../../models/common';

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

    /** @type {import('../../models').AppSettings} */
    const { locationSettings } = useSelector((state) => state.settings);

    const snapPoints = useMemo(() => ['80%'], []);
    const [searchRadiusValue, setSearchRadiusValue] = useState(
      locationSettings?.searchRadius ?? 0,
    );

    const handleApplyChanges = () => {
      const updateAction = didUpdateLocationQueryPreferences({
        searchRadius: searchRadiusValue,
      });

      dispatch(updateAction);
      ref.current?.dismiss();
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
              <MapView
                initialRegion={{
                  ...DEFAULT_COORDINATES,
                  latitudeDelta: 1.0,
                  longitudeDelta: 1.0,
                }}
                style={{ flexGrow: 1 }}
              />
            </View>
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text style={searchLocationModalStyles.sliderTextIndicator}>
                  3km
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
                  25km
                </Text>
              </View>
              <Slider
                step={1}
                minimumValue={3}
                maximumValue={25}
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
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
            }}>
            <Button
              title="Reset"
              onPress={() => ref.current?.dismiss()}
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
