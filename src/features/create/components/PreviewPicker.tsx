import * as React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TouchableOpacityProps,
  useWindowDimensions,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { useField } from 'formik';

import { Spacer } from 'src/components';
import { color, font, layout, values } from 'src/constants';
import { useExtendedTheme } from 'src/hooks';

export interface PreviewPickerMethods {
  scrollToEnd: () => void;
}

export interface PreviewPickerProps<ItemT> {
  fieldName: string;
  maxCount: number;
  caption: string;
  iconName?: string;
  description?: string;
  renderItem: PreviewPickerItemProps<ItemT>['renderItem'];
  onAddItem?: () => void | Promise<void>;
  onSelectItemAtIndex?: (index: number) => void | Promise<void>;
}

function PreviewPickerInner<ItemT>(
  props: PreviewPickerProps<ItemT>,
  ref: React.Ref<PreviewPickerMethods>,
) {
  const [_, meta, helpers] = useField<ItemT[]>(props.fieldName);
  const { value: items } = meta;
  const { setValue: setItems } = helpers;

  const { width: windowWidth } = useWindowDimensions();
  const { colors, dark } = useExtendedTheme();
  const itemWidth = React.useMemo(() => windowWidth * 0.7, [windowWidth]);
  const flatListRef = React.useRef<FlatList<ItemT>>(null);

  const handleRemoveItemAtIndex = async (index: number) => {
    const newItemArray = [...items.slice(0, index), ...items.slice(index + 1)];
    setItems(newItemArray);
  };

  React.useImperativeHandle(ref, () => ({
    scrollToEnd: () => flatListRef.current?.scrollToEnd(),
  }));

  return (
    <View>
      <View style={previewPickerStyles.captionContainer}>
        <Text
          style={[font.medium, { color: color.gray500, textAlign: 'center' }]}>
          {props.caption}
        </Text>
        {meta.touched && meta.error ? (
          <Text
            style={[
              previewPickerStyles.descriptionText,
              { color: color.danger },
            ]}>
            {meta.error}
          </Text>
        ) : (
          props.description && (
            <Text
              style={[
                previewPickerStyles.descriptionText,
                { color: color.gray500 },
              ]}>
              {props.description}
            </Text>
          )
        )}
      </View>
      <FlatList<ItemT>
        horizontal
        data={items}
        ref={flatListRef}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(_, index) => `preview-picker-item-${index}`}
        getItemLayout={(_, index) => {
          const itemLength = itemWidth + layout.spacing.md;
          return { index, length: itemLength, offset: itemLength * index };
        }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: layout.spacing.lg,
          paddingVertical: layout.spacing.lg,
          justifyContent: 'center',
        }}
        ItemSeparatorComponent={() => <Spacer.Horizontal value="md" />}
        renderItem={({ item, index }) => (
          <PickerItem
            index={index}
            item={item}
            itemWidth={itemWidth}
            renderItem={props.renderItem}
            isAboveLimit={index >= props.maxCount}
            onPressItem={async () => await props.onSelectItemAtIndex?.(index)}
            onPressRemove={async () => await handleRemoveItemAtIndex(index)}
          />
        )}
        ListFooterComponent={() => {
          if (items.length >= props.maxCount) return null;
          return (
            <TouchableHighlight
              underlayColor={dark ? color.black : colors.highlight}
              onPress={props.onAddItem}
              style={[
                previewPickerStyles.itemTouchableContainer,
                previewPickerStyles.addItemButton,
                { width: itemWidth, borderColor: colors.caption },
              ]}>
              <Icon
                name={props.iconName ?? 'add-outline'}
                color={color.accent}
                size={50}
              />
            </TouchableHighlight>
          );
        }}
        ListFooterComponentStyle={{
          paddingLeft:
            items.length > 0 && items.length < props.maxCount
              ? layout.spacing.md
              : undefined,
        }}
      />
    </View>
  );
}

type PreviewPickerRenderItemInfo<ItemT> = {
  index: number;
  item: ItemT;
  itemWidth: number;
  isAboveLimit: boolean;
};

type PreviewPickerItemProps<ItemT> = {
  index: number;
  item: ItemT;
  itemWidth: number;
  isAboveLimit: boolean;
  renderItem: (info: PreviewPickerRenderItemInfo<ItemT>) => React.ReactNode;
  onPressItem?: TouchableOpacityProps['onPress'];
  onPressRemove?: TouchableOpacityProps['onPress'];
};

function PickerItem<ItemT>(props: PreviewPickerItemProps<ItemT>) {
  return (
    <TouchableOpacity
      activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
      onPress={props.onPressItem}>
      <TouchableOpacity
        activeOpacity={values.DEFAULT_ACTIVE_OPACITY}
        onPress={props.onPressRemove}
        hitSlop={{ top: 30, right: 30, bottom: 30, left: 30 }}
        style={previewPickerStyles.removeIconContainer}>
        <Icon name="close" size={24} color={color.white} />
      </TouchableOpacity>
      {props.renderItem({
        index: props.index,
        item: props.item,
        itemWidth: props.itemWidth,
        isAboveLimit: props.isAboveLimit,
      })}
    </TouchableOpacity>
  );
}

const previewPickerStyles = StyleSheet.create({
  captionContainer: {
    paddingHorizontal: layout.spacing.lg,
  },
  descriptionText: {
    ...font.smallBold,
    paddingTop: layout.spacing.sm,
    textAlign: 'center',
  },
  itemTouchableContainer: {
    aspectRatio: 1,
    borderRadius: layout.radius.md,
    overflow: 'hidden',
  },
  addItemButton: {
    borderWidth: layout.border.thick,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIconContainer: {
    zIndex: 10,
    position: 'absolute',
    top: layout.spacing.md,
    right: layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layout.spacing.xs,
    paddingHorizontal: layout.spacing.xs,
    borderRadius: layout.radius.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
});

declare type PreviewPicker = PreviewPickerMethods;
const PreviewPicker = React.forwardRef(PreviewPickerInner);

export default PreviewPicker;
