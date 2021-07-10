// Adapted from @react-native-seoul/masonry-list

import React from 'react';
import { ScrollView as RNScrollView, View } from 'react-native';

/**
 *
 * @param {import('react-native').NativeScrollEvent} param0
 * @param {number} onEndReachedThreshold
 * @returns {boolean}
 */
const isCloseToBottom = (
  { layoutMeasurement, contentOffset, contentSize },
  onEndReachedThreshold,
) => {
  const paddingToBottom = contentSize.height * onEndReachedThreshold;

  return (
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom
  );
};

/**
 * @typedef {import('react-native').ScrollViewProps} ScrollViewProps
 */

/**
 * @template ItemT
 * @typedef {{ item: ItemT, index: number, column: number }} RenderItemInfo<ItemT>
 */

/**
 * @template ItemT
 * @typedef {{
 *   data: ItemT[],
 *   numOfColumns?: number,
 *   onEndReached?: () => void,
 *   onEndReachedThreshold?: number,
 *   renderItem: (info: RenderItemInfo<ItemT>) => React.ReactElement | null,
 *   ScrollViewComponent?: React.ComponentType<ScrollViewProps>,
 *   ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null,
 *   ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null,
 *   ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null,
 * }} MasonryListProps<ItemT>
 */

/**
 * @template ItemT
 * @param {MasonryListProps<ItemT> & ScrollViewProps} props
 */
export default function MasonryList(props) {
  const {
    data,
    numOfColumns = 2,
    renderItem,
    onEndReached,
    onEndReachedThreshold,
    ScrollViewComponent,
    ListHeaderComponent,
    ListEmptyComponent,
    ListFooterComponent,
    ...scrollViewProps
  } = props;

  const ScrollView = ScrollViewComponent ?? RNScrollView;

  return (
    <ScrollView
      {...scrollViewProps}
      removeClippedSubviews
      scrollEventThrottle={16}
      onScroll={({ nativeEvent }) => {
        if (isCloseToBottom(nativeEvent, onEndReachedThreshold || 0.1))
          onEndReached?.();
      }}
      style={[{ alignSelf: 'stretch' }, scrollViewProps.style]}>
      {ListHeaderComponent}
      {data.length === 0 && ListEmptyComponent ? (
        React.isValidElement(ListEmptyComponent) ? (
          ListEmptyComponent
        ) : (
          <ListEmptyComponent />
        )
      ) : (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {Array.from(Array(numOfColumns), (_, colIndex) => {
            return (
              <View
                key={`masonry-column-${colIndex}`}
                style={{ flex: 1 / numOfColumns }}>
                {data
                  .map((item, index) => {
                    if (index % numOfColumns === colIndex)
                      return renderItem({ item, index, column: colIndex });

                    return null;
                  })
                  .filter((item) => !!item)}
              </View>
            );
          })}
        </View>
      )}
      {ListFooterComponent}
    </ScrollView>
  );
}
