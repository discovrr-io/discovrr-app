// Adapted from @react-native-seoul/masonry-list

import React from 'react';
import { ScrollView, View } from 'react-native';

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
 *   ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null,
 *   ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null,
 *   ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null,
 * }} MasonryListProps<ItemT>
 */

/**
 * @typedef {import('react-native').ScrollViewProps} ScrollViewProps
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
    ListHeaderComponent,
    ListEmptyComponent,
    ListFooterComponent,
    ...scrollViewProps
  } = props;

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
