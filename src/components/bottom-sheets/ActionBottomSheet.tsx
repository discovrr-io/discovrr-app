import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  useBottomSheet,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';

import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import Spacer from '../Spacer';
import Button, { ButtonProps } from '../buttons/Button';
import { color, font, layout } from 'src/constants';

const ICON_SIZE = 24;
const ITEM_SPACING = layout.spacing.sm;

export type ActionBottomSheetItem = {
  id: string;
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
          snapPoints={animatedSnapPoints}
          handleHeight={animatedHandleHeight}
          contentHeight={animatedContentHeight}
          backdropComponent={renderBackdrop}>
          <BottomSheetView
            onLayout={handleContentLayout}
            style={styles.container}>
            <SafeAreaView edges={['bottom', 'left', 'right']}>
              <ActionBottomSheetContents {...props} />
            </SafeAreaView>
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
    <>
      <View>
        {items.map((props: ActionBottomSheetItem, index) => (
          <View key={`action-bottom-sheet-item-${index}`}>
            <TouchableHighlight
              underlayColor={color.gray100}
              onPress={async () => await handleSelectItem(props.id)}
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
        onPress={footerButtonOnPress ?? (() => close())}
      />
    </>
  );
}

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
