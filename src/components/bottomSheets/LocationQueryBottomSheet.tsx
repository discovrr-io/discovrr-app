import React from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { Portal } from '@gorhom/portal';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import Spacer from '../Spacer';
import { color, font, layout } from 'src/constants';

const ICON_SIZE = 24;
const ICON_PADDING = layout.spacing.md * 1;
const ICON_DIAMETER = ICON_SIZE + ICON_PADDING;

// eslint-disable-next-line @typescript-eslint/ban-types
type LocationQueryBottomSheetProps = {};

const LocationQueryBottomSheet = React.forwardRef<
  BottomSheet,
  LocationQueryBottomSheetProps
>((props: LocationQueryBottomSheetProps, ref) => {
  const snapPoints = React.useMemo(() => ['95%'], []);

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
        // enablePanDownToClose
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}>
        <LocationQueryBottomSheetHeader onPressClose={handleCloseBottomSheet} />
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.spacing.lg,
            paddingVertical: layout.spacing.lg,
            backgroundColor: 'lightgreen',
          }}>
          {[...new Array(100).keys()].map(n => (
            <Text key={`text-${n}`} style={[font.medium]}>
              TEST {n}
            </Text>
          ))}
        </BottomSheetScrollView>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.spacing.md,
        paddingVertical: layout.spacing.md,
        backgroundColor: 'lightblue',
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
