// Adapted from @react-native-seoul/masonry-list
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import {
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
  View,
  NativeScrollEvent,
} from 'react-native';

function isCloseToBottom(
  { layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent,
  onEndReachedThreshold: number,
): boolean {
  const paddingToBottom = contentSize.height * onEndReachedThreshold;

  return (
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom
  );
}

export type RenderItemInfo<ItemT> = {
  item: ItemT;
  index: number;
  column: number;
};

export type MasonryListProps<ItemT> = RNScrollViewProps & {
  data: ItemT[];
  // keyExtractor?: ((item: ItemT, index: number) => string) ,
  numOfColumns?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  renderItem: (info: RenderItemInfo<ItemT>) => React.ReactElement | null;
  ScrollViewComponent?: React.ComponentType<RNScrollViewProps> | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
};

function MasonryListInner<ItemT>(
  props: MasonryListProps<ItemT>,
  ref: React.ForwardedRef<RNScrollView>,
) {
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
      // @ts-ignore For now, we won't care if we can't pass in ref
      ref={ref}
      indicatorStyle="black"
      removeClippedSubviews
      scrollEventThrottle={16}
      onScroll={({ nativeEvent }: { nativeEvent: NativeScrollEvent }) => {
        if (isCloseToBottom(nativeEvent, onEndReachedThreshold || 0.1)) {
          onEndReached?.();
        }
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
                    if (index % numOfColumns === colIndex) {
                      return renderItem({ item, index, column: colIndex });
                    } else {
                      return null;
                    }
                  })
                  .filter(item => !!item)}
              </View>
            );
          })}
        </View>
      )}
      {ListFooterComponent}
    </ScrollView>
  );
}

const MasonryList = React.forwardRef(MasonryListInner);

export default MasonryList;
