import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { Portal } from '@gorhom/portal';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  useBottomSheet,
  useBottomSheetDynamicSnapPoints,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';

import Spacer from '../Spacer';
import Button, { ButtonProps } from '../buttons/Button';
import * as constants from 'src/constants';

const ICON_SIZE = 24;
const ITEM_SPACING = constants.layout.spacing.sm;

export type ActionBottomSheetItem = {
  id: string;
  label: string;
  iconName: string;
  iconSize?: number;
  destructive?: boolean;
  disabled?: boolean;
};

type ActionBottomSheetProps = {
  items?: ActionBottomSheetItem[];
  footerButtonTitle?: string;
  footerButtonType?: ButtonProps['type'];
  footerButtonVariant?: ButtonProps['variant'];
  footerButtonOnPress?: ButtonProps['onPress'];
  onSelectItem?: (id: string) => void | Promise<void>;
};

const ActionBottomSheet = React.forwardRef<BottomSheet, ActionBottomSheetProps>(
  (props: ActionBottomSheetProps, ref) => {
    const initialSnapPoints = React.useMemo(() => ['CONTENT_HEIGHT'], []);

    const {
      animatedHandleHeight,
      animatedSnapPoints,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

    const animationConfigs = useBottomSheetTimingConfigs({
      duration: 300,
    });

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
          animationConfigs={animationConfigs}
          snapPoints={animatedSnapPoints}
          handleHeight={animatedHandleHeight}
          contentHeight={animatedContentHeight}
          backdropComponent={renderBackdrop}>
          <BottomSheetView
            onLayout={handleContentLayout}
            style={styles.container}>
            <ActionBottomSheetContents {...props} />
          </BottomSheetView>
        </BottomSheet>
      </Portal>
    );
  },
);

function ActionBottomSheetContents(props: ActionBottomSheetProps) {
  const {
    items = [],
    footerButtonTitle = 'Cancel',
    footerButtonType = 'secondary',
    footerButtonVariant = 'contained',
    footerButtonOnPress,
    onSelectItem,
  } = props;

  const { close } = useBottomSheet();

  const handleSelectItem = async (id: string) => {
    close();
    await onSelectItem?.(id);
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']}>
      <View>
        {items.map((props: ActionBottomSheetItem, index) => (
          <View key={`action-bottom-sheet-item-${index}`}>
            <TouchableHighlight
              underlayColor={constants.color.gray100}
              disabled={props.disabled}
              onPress={async () => await handleSelectItem(props.id)}
              style={styles.actionItemTouchableContainer}>
              <View style={styles.actionItemContainer}>
                <Icon
                  name={props.iconName}
                  size={props.iconSize ?? ICON_SIZE}
                  // color={props.destructive ? color.danger : color.black}
                  color={
                    props.disabled
                      ? props.destructive
                        ? constants.color.dangerDisabled
                        : constants.color.disabledDarkTextColor
                      : props.destructive
                      ? constants.color.danger
                      : constants.color.black
                  }
                  style={[{ width: ICON_SIZE }]}
                />
                <Spacer.Horizontal value={constants.layout.spacing.lg} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.actionItemLabel,
                    constants.font.large,
                    props.disabled && {
                      color: constants.color.disabledDarkTextColor,
                    },
                    props.destructive && {
                      color: props.disabled
                        ? constants.color.dangerDisabled
                        : constants.color.danger,
                    },
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
      <Spacer.Vertical value={constants.layout.spacing.md} />
      <Button
        title={footerButtonTitle}
        type={footerButtonType}
        variant={footerButtonVariant}
        onPress={footerButtonOnPress ?? (() => close())}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: constants.layout.spacing.lg,
    paddingBottom: constants.layout.spacing.lg,
  },
  actionItemTouchableContainer: {
    borderRadius: constants.layout.radius.md,
    // height: BOTTOM_SHEET_ITEM_HEIGHT,
    overflow: 'hidden',
  },
  actionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: constants.layout.spacing.md,
  },
  actionItemLabel: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

export default ActionBottomSheet;
