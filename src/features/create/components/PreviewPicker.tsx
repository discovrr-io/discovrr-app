import * as React from 'react';
import {
  FlatList,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TouchableOpacityProps,
  useWindowDimensions,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import { Spacer } from 'src/components';
import { color, font, layout, values } from 'src/constants';
import { useField } from 'formik';

export interface PreviewPickerMethods {
  scrollToEnd: () => void;
}

export interface PreviewPickerProps<MediaT> {
  fieldName: string;
  maxCount: number;
  caption: string;
  renderItem: PreviewPickerItemProps<MediaT>['renderItem'];
  onAddItem?: () => void | Promise<void>;
  onSelectItemAtIndex?: (index: number) => void | Promise<void>;
}

function PreviewPickerInner<MediaT>(
  props: PreviewPickerProps<MediaT>,
  ref: React.Ref<PreviewPickerMethods>,
) {
  const [_, meta, helpers] = useField<MediaT[]>(props.fieldName);
  const { value: media } = meta;
  const { setValue: setMedia } = helpers;

  const { width: windowWidth } = useWindowDimensions();
  const itemWidth = React.useMemo(() => windowWidth / 2, [windowWidth]);
  const flatListRef = React.useRef<FlatList<MediaT>>(null);

  const handleRemoveImageAtIndex = async (index: number) => {
    const newItemArray = [...media.slice(0, index), ...media.slice(index + 1)];
    setMedia(newItemArray);
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
        {meta.touched && meta.error && (
          <Text
            style={[
              font.smallBold,
              {
                color: color.danger,
                paddingTop: layout.spacing.sm,
                textAlign: 'center',
              },
            ]}>
            {meta.error}
          </Text>
        )}
      </View>
      <FlatList<MediaT>
        horizontal
        data={media}
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
            item={item}
            index={index}
            renderItem={props.renderItem}
            isAboveLimit={index >= props.maxCount}
            onPressItem={async () => await props.onSelectItemAtIndex?.(index)}
            onPressRemove={async () => await handleRemoveImageAtIndex(index)}
            style={{ width: itemWidth }}
          />
        )}
        ListFooterComponent={() => {
          if (media.length >= props.maxCount) return null;
          return (
            <TouchableHighlight
              underlayColor={color.gray100}
              onPress={props.onAddItem}
              style={[
                previewPickerStyles.itemTouchableContainer,
                previewPickerStyles.addItemButton,
                { width: itemWidth },
              ]}>
              <Icon name="add-outline" color={color.accent} size={60} />
            </TouchableHighlight>
          );
        }}
        ListFooterComponentStyle={{
          paddingLeft:
            media.length > 0 && media.length < props.maxCount
              ? layout.spacing.md
              : undefined,
        }}
      />
    </View>
  );
}

type PreviewPickerRenderItemInfo<MediaT> = {
  index: number;
  item: MediaT;
  itemWidth: number;
  isAboveLimit: boolean;
};

type PreviewPickerItemProps<MediaT> = {
  item: MediaT;
  index: number;
  isAboveLimit: boolean;
  renderItem: (info: PreviewPickerRenderItemInfo<MediaT>) => React.ReactNode;
  onPressItem?: TouchableOpacityProps['onPress'];
  onPressRemove?: TouchableOpacityProps['onPress'];
  style?: StyleProp<ImageStyle>;
};

function PickerItem<MediaT>(props: PreviewPickerItemProps<MediaT>) {
  const { width: windowWidth } = useWindowDimensions();
  const itemWidth = React.useMemo(() => windowWidth / 2, [windowWidth]);

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
        itemWidth,
        index: props.index,
        item: props.item,
        isAboveLimit: props.isAboveLimit,
      })}
    </TouchableOpacity>
  );
}

const previewPickerStyles = StyleSheet.create({
  captionContainer: {
    paddingHorizontal: layout.spacing.lg,
  },
  itemTouchableContainer: {
    aspectRatio: 1,
    borderRadius: layout.radius.md,
    overflow: 'hidden',
  },
  addItemButton: {
    borderColor: color.gray500,
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
