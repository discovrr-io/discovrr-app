import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';

import Icon from 'react-native-vector-icons/Ionicons';

import Spacer from '../Spacer';
import { color, font, layout } from 'src/constants';
import Button, { ButtonProps } from '../buttons/Button';

const ICON_SIZE = 24;
const ITEM_SPACING = layout.spacing.sm;

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
    const $FUNC = '[ActionBottomSheet]';
    const {
      items = [],
      footerButtonTitle = 'Cancel',
      footerButtonType = 'secondary',
      footerButtonVariant = 'contained',
      footerButtonOnPress,
      onSelectItem,
    } = props;

    const initialSnapPoints = React.useMemo(() => ['CONTENT_HEIGHT'], []);
    const {
      animatedHandleHeight,
      animatedSnapPoints,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

    React.useEffect(() => {
      console.log($FUNC, 'REF', ref);
    }, [ref]);

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
        console.warn($FUNC, 'Ref is a function');
      } else {
        ref?.current?.close();
      }
    };

    const handleSelectItem = async (item: string) => {
      handleCloseBottomSheet();
      console.log($FUNC, item);
      await onSelectItem?.(item);
    };

    return (
      <Portal>
        <BottomSheet
          ref={ref}
          index={-1}
          animateOnMount
          enablePanDownToClose
          snapPoints={animatedSnapPoints}
          handleHeight={animatedHandleHeight}
          contentHeight={animatedContentHeight}
          backdropComponent={renderBackdrop}>
          <BottomSheetView
            onLayout={handleContentLayout}
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
                      <Spacer.Horizontal value={layout.spacing.lg} />
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
                  {index < items.length - 1 && (
                    <Spacer.Vertical value={ITEM_SPACING} />
                  )}
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
    // height: BOTTOM_SHEET_ITEM_HEIGHT,
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
