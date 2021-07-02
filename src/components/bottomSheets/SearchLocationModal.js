import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import Slider from '@react-native-community/slider';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { Button } from '../../components';
import { colors, typography, values } from '../../constants';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

/**
 * @typedef {import('@gorhom/bottom-sheet').BottomSheetBackdropProps} BottomSheetBackdropProps
 * @param {BottomSheetBackdropProps} param0
 */
function SearchLocationModalBackdrop({ animatedIndex, style }) {
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0, 0.8],
      [0, 0.8],
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
    const snapPoints = useMemo(() => ['75%'], []);

    return (
      <BottomSheetModal
        ref={ref}
        {...props}
        snapPoints={snapPoints}
        backdropComponent={SearchLocationModalBackdrop}>
        <View
          style={{
            flex: 1,
            padding: values.spacing.xl,
            paddingTop: values.spacing.lg,
            justifyContent: 'space-between',
          }}>
          <View>
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: '600',
                textAlign: 'center',
              }}>
              Search Location
            </Text>
            <View
              style={{
                height: 320,
                backgroundColor: colors.gray100,
                marginVertical: values.spacing.lg,
              }}
            />
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <Text>3km</Text>
                <Text>25km</Text>
              </View>
              <Slider minimumValue={3} maximumValue={25} />
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Button
              title="Reset"
              onPress={() => ref.current.dismiss()}
              style={{ flexGrow: 1, marginRight: values.spacing.md }}
            />
            <Button primary title="Apply" style={{ flexGrow: 1 }} />
          </View>
        </View>
      </BottomSheetModal>
    );
  },
);

export default SearchLocationModal;
