import * as React from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal } from '@gorhom/portal';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  useBottomSheet,
  useBottomSheetDynamicSnapPoints,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';

import Spacer from '../Spacer';
import Button from '../buttons/Button';
import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';

type SelectFromLibraryBottomSheetProps = Pick<
  SelectFromLibraryBottomSheetContentsProps,
  'onSelectItem'
>;

const SelectFromLibraryBottomSheet = React.forwardRef<
  BottomSheet,
  SelectFromLibraryBottomSheetProps
>((props, ref) => {
  const { colors } = useExtendedTheme();

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
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.text }}
        backgroundStyle={{ backgroundColor: colors.card }}>
        <BottomSheetView
          onLayout={handleContentLayout}
          style={{
            paddingTop: constants.layout.spacing.sm,
            paddingBottom: constants.layout.spacing.lg,
            paddingHorizontal: constants.layout.spacing.lg,
          }}>
          <SelectFromLibraryBottomSheetContents
            items={[
              { id: 'photo', iconName: 'image-outline', iconLabel: 'Photo' },
              { id: 'video', iconName: 'film-outline', iconLabel: 'Video' },
            ]}
            onSelectItem={props.onSelectItem}
          />
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
});

type SelectFromLibraryBottomSheetContentsProps = {
  caption?: string;
  items?: SelectFromLibraryBottomSheetIconProps[];
  onSelectItem?: (id: string) => void | Promise<void>;
};

function SelectFromLibraryBottomSheetContents(
  props: SelectFromLibraryBottomSheetContentsProps,
) {
  const { close } = useBottomSheet();

  const handleSelectItem = async (id: string) => {
    close();
    await props.onSelectItem?.(id);
  };

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ alignItems: 'center' }}>
      <Text
        style={[constants.font.bodyBold, { color: constants.color.gray500 }]}>
        {props.caption || 'What would you like to upload?'}
      </Text>
      {props.items && (
        <>
          <Spacer.Vertical value="lg" />
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: constants.layout.spacing.md,
            }}>
            {props.items.map((iconProps, index, items) => (
              <React.Fragment
                key={`select-from-library-bottom-sheet-item-${index}`}>
                <SelectFromLibraryBottomSheetIcon
                  {...iconProps}
                  onPress={async () => await handleSelectItem(iconProps.id)}
                />
                {index < items.length - 1 && <Spacer.Horizontal value="md" />}
              </React.Fragment>
            ))}
          </View>
        </>
      )}
      <Spacer.Vertical value="lg" />
      <Button
        title="Cancel"
        variant="contained"
        onPress={() => close()}
        containerStyle={{ width: '100%' }}
      />
    </SafeAreaView>
  );
}

type SelectFromLibraryBottomSheetIconProps = {
  id: string;
  iconName: string;
  iconLabel: string;
  onPress?: () => void | Promise<void>;
};

function SelectFromLibraryBottomSheetIcon(
  props: SelectFromLibraryBottomSheetIconProps,
) {
  const { colors } = useExtendedTheme();
  return (
    <TouchableHighlight
      underlayColor={colors.highlight}
      onPress={props.onPress}
      style={{
        flexGrow: 1,
        flexShrink: 1,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.border,
        borderRadius: constants.layout.radius.md,
        borderWidth: 1,
      }}>
      <View style={{ alignItems: 'center' }}>
        <Icon name={props.iconName} size={40} color={colors.text} />
        <Spacer.Vertical value="sm" />
        <Text style={[constants.font.bodyBold, { color: colors.text }]}>
          {props.iconLabel}
        </Text>
      </View>
    </TouchableHighlight>
  );
}

export default SelectFromLibraryBottomSheet;
