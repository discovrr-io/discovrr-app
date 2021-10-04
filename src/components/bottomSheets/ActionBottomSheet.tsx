import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';

import Icon from 'react-native-vector-icons/Ionicons';

import Spacer from '../Spacer';
import { Button, ButtonProps } from '..';
import { color, font, layout } from 'src/constants';

const ICON_SIZE = 24;
const BOTTOM_SHEET_ITEM_HEIGHT = 42;
const BOTTOM_SHEET_KNOB_HEIGHT = 24;
const BOTTOM_SHEET_NO_ITEMS_HEIGHT = 98 - BOTTOM_SHEET_KNOB_HEIGHT;
const BOTTOM_SHEET_ITEM_SPACING = layout.spacing.sm;

export type ActionBottomSheetItem = {
  label: string;
  iconName: string;
  iconSize?: number;
  destructive?: boolean;
};

type ActionBottomSheetProps = {
  items?: ActionBottomSheetItem[];
  footerButtonTitle?: string;
  footerButtonType?: ButtonProps['type'];
  footerButtonVariant?: ButtonProps['variant'];
  footerButtonOnPress?: ButtonProps['onPress'];
  onSelectItem?: (item: string) => void | Promise<void>;
};

const ActionBottomSheet = React.forwardRef<BottomSheet, ActionBottomSheetProps>(
  (props: ActionBottomSheetProps, ref) => {
    const {
      items = [],
      footerButtonTitle = 'Cancel',
      footerButtonType = 'secondary',
      footerButtonVariant = 'contained',
      footerButtonOnPress,
      onSelectItem,
    } = props;

    // NOTE: Dynamically resizing the bottom sheet causes flickering on iOS
    // const [contentHeight, setContentHeight] = React.useState(0);
    // const snapPoints = React.useMemo(() => [contentHeight], [contentHeight]);
    // const handleOnLayout = React.useCallback((event: LayoutChangeEvent) => {
    //   setContentHeight(event.nativeEvent.layout.height);
    // }, []);

    const snapPoints = React.useMemo(() => {
      const itemsContainerHeight =
        BOTTOM_SHEET_ITEM_HEIGHT * items.length +
        BOTTOM_SHEET_ITEM_SPACING * Math.max(0, items.length - 1);
      const fittedHeight = BOTTOM_SHEET_NO_ITEMS_HEIGHT + itemsContainerHeight;
      return [fittedHeight];
    }, [items.length]);

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

    const handleSelectItem = async (item: string) => {
      handleCloseBottomSheet();
      console.log('[ActionBottomSheet]', item);
      await onSelectItem?.(item);
    };

    return (
      <Portal>
        <BottomSheet
          ref={ref}
          index={-1}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}>
          <BottomSheetView
            // onLayout={handleOnLayout}
            style={styles.container}>
            <View>
              {items.map((props: ActionBottomSheetItem, index) => (
                <View key={`action-bottom-sheet-item-${index}`}>
                  <TouchableHighlight
                    underlayColor={color.gray100}
                    onPress={async () => await handleSelectItem(props.label)}
                    style={styles.actionItemTouchableContainer}>
                    <View style={styles.actionItemContainer}>
                      <Icon
                        name={props.iconName}
                        size={props.iconSize ?? ICON_SIZE}
                        color={props.destructive ? color.danger : color.black}
                        style={{ width: ICON_SIZE }}
                      />
                      {/* <Spacer.Horizontal value={layout.spacing.lg} /> */}
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.actionItemLabel,
                          font.large,
                          props.destructive && { color: color.danger },
                        ]}>
                        {props.label}
                      </Text>
                    </View>
                  </TouchableHighlight>
                  {/* {index < items.length - 1 && (
                    <Spacer.Vertical value={BOTTOM_SHEET_ITEM_SPACING} />
                  )} */}
                </View>
              ))}
            </View>
            <Spacer.Vertical value={layout.spacing.md} />
            <Button
              title={footerButtonTitle}
              type={footerButtonType}
              variant={footerButtonVariant}
              onPress={footerButtonOnPress ?? handleCloseBottomSheet}
            />
          </BottomSheetView>
        </BottomSheet>
      </Portal>
    );
  },
);

ActionBottomSheet.displayName = 'ActionBottomSheet';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.spacing.lg,
    paddingBottom: layout.spacing.lg,
  },
  actionItemTouchableContainer: {
    borderRadius: layout.radius.md,
    height: BOTTOM_SHEET_ITEM_HEIGHT,
    overflow: 'hidden',
  },
  actionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.md,
  },
  actionItemLabel: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

export default ActionBottomSheet;
