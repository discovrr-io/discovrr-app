import * as React from 'react';
import { FlatList, FlatListProps, View } from 'react-native';

import { Spacer } from '.';

type BrickLayout = {
  width: number;
  height: number;
};

type Brick<ItemT> = {
  item: ItemT;
  layout: BrickLayout;
};

type Column<ItemT> = Brick<ItemT>[];

type MasonryListColumnItem<ItemT> =
  | { type: 'column'; data: Column<ItemT> }
  | { type: 'gutter'; width: number };

export type RenderItemInfo<ItemT> = {
  item: ItemT;
  index: number;
  column: number;
  layout: BrickLayout;
};

export type MasonryListProps<ItemT> = Omit<
  FlatListProps<MasonryListColumnItem<ItemT>>,
  'data' | 'renderItem' | 'keyExtractor' | 'getItemLayout'
> & {
  data: ItemT[];
  spacing?: number;
  getBrickHeight: (item: ItemT, brickWidth: number) => number;
  renderItem: (info: RenderItemInfo<ItemT>) => React.ReactElement | null;
  debug?: boolean;
  containerWidth?: number;
  keyExtractor?: ((item: ItemT, index: number) => string) | undefined;
  getItemLayout?:
    | ((
        data: Array<ItemT> | null | undefined,
        index: number,
      ) => { length: number; offset: number; index: number })
    | undefined;
};

function MasonryListInner<ItemT>(
  props: MasonryListProps<ItemT>,
  ref: React.ForwardedRef<FlatList<MasonryListColumnItem<ItemT>>>,
) {
  const {
    numColumns = 2,
    spacing = 0,
    data,
    getBrickHeight,
    containerWidth,
    renderItem,
    keyExtractor,
    initialNumToRender,
    debug = false,
  } = props;

  const [layoutWidth, setLayoutWidth] = React.useState(containerWidth ?? 0);

  React.useEffect(() => {
    console.log('LAYOUT WIDTH:', layoutWidth);
  }, [layoutWidth]);

  const brickData = React.useMemo(() => {
    if (!data) return [];

    const itemWidth = (layoutWidth - (numColumns + 1) * spacing) / numColumns;
    return data.map(item => ({
      item,
      layout: {
        height: getBrickHeight(item, itemWidth),
        width: itemWidth,
      },
    }));
  }, [data, layoutWidth, numColumns, getBrickHeight, spacing]);

  const columnsData = React.useMemo(() => {
    const columns: Column<ItemT>[] = Array.from(
      { length: numColumns },
      _ => [],
    );

    const columnsHeight = columns.map(() => 0);

    brickData.forEach(brick => {
      const shortestHeight = Math.min(...columnsHeight);
      const shortestHeightIndex = columnsHeight.indexOf(shortestHeight);

      columns[shortestHeightIndex].push(brick);
      columnsHeight[shortestHeightIndex] =
        columnsHeight[shortestHeightIndex] + brick.layout.height;
    });

    return [
      { type: 'gutter', width: spacing } as MasonryListColumnItem<ItemT>,
      ...columns.flatMap<MasonryListColumnItem<ItemT>>(column => [
        { type: 'column', data: column },
        { type: 'gutter', width: spacing },
      ]),
    ];
  }, [brickData, spacing, numColumns]);

  return (
    <FlatList
      ref={ref}
      data={columnsData}
      listKey="masonry-list-flatlist-root"
      onLayout={e => setLayoutWidth(e.nativeEvent.layout.width)}
      keyExtractor={(_, index) => `masonry-list-flatlist-child-2-${index}`}
      contentContainerStyle={[
        { flexDirection: 'row', paddingVertical: spacing },
        debug && { backgroundColor: 'pink' },
      ]}
      renderItem={({ item, index: columnIndex }) => {
        if (item.type === 'column') {
          return (
            <FlatList
              removeClippedSubviews
              initialNumToRender={initialNumToRender ?? numColumns * 4}
              data={item.data}
              listKey={`masonry-list-flatlist-child-${columnIndex}`}
              key={`masonry-list-column-item-${columnIndex}`}
              style={[debug && { backgroundColor: 'lightgreen' }]}
              ItemSeparatorComponent={() => <Spacer.Vertical value={spacing} />}
              renderItem={({ item: brick, index: brickIndex }) => (
                <View
                  key={
                    keyExtractor?.(brick.item, brickIndex) ??
                    `masonry-list-brick-${columnIndex}-${brickIndex}`
                  }>
                  {renderItem({
                    index: brickIndex,
                    item: brick.item,
                    layout: brick.layout,
                    column: columnIndex,
                  })}
                </View>
              )}
            />
          );
        } else {
          return (
            <Spacer.Horizontal
              key={`masonry-list-spacer-${columnIndex}`}
              value={spacing}
              style={[debug && { height: 50, backgroundColor: 'red' }]}
            />
          );
        }
      }}
    />
  );
}

export default React.forwardRef(MasonryListInner);
