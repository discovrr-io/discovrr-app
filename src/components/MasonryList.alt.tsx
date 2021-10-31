import * as React from 'react';
import { FlatList, FlatListProps, View } from 'react-native';

import Spacer from './Spacer';
import * as constants from 'src/constants';

type BrickLayout = {
  width: number;
  height: number;
};

type Brick<ItemT> = {
  index: number;
  item: ItemT;
  layout: BrickLayout;
};

type Column<ItemT> = Brick<ItemT>[];

type MasonryListItem<ItemT> =
  | { type: 'column'; data: Column<ItemT> }
  | { type: 'gutter'; width: number };

export type RenderItemInfo<ItemT> = {
  item: ItemT;
  index: number;
  column: number;
  layout: BrickLayout;
};

export type MasonryListProps<ItemT> = Omit<
  FlatListProps<MasonryListItem<ItemT>>,
  'data' | 'renderItem' | 'keyExtractor' | 'getItemLayout'
> & {
  data: ItemT[];
  spacing?: number;
  debug?: boolean;
  containerWidth?: number;
  getBrickHeight: (item: ItemT, brickWidth: number) => number;
  renderItem: (info: RenderItemInfo<ItemT>) => React.ReactElement | null;
  keyExtractor?: ((item: ItemT, index: number) => string) | undefined;
  getItemLayout?:
    | ((
        data: Array<MasonryListItem<ItemT>> | null | undefined,
        index: number,
      ) => { length: number; offset: number; index: number })
    | undefined;
};

function MasonryListInner<ItemT>(
  props: MasonryListProps<ItemT>,
  ref: React.ForwardedRef<FlatList<MasonryListItem<ItemT>>>,
) {
  console.log('REND MASONRY LIST');

  const {
    numColumns = 2,
    spacing = constants.values.DEFAULT_TILE_SPACING,
    data,
    getBrickHeight,
    containerWidth,
    renderItem,
    keyExtractor,
    initialNumToRender,
    debug = false,
    ...restProps
  } = props;

  const [layoutWidth, setLayoutWidth] = React.useState(containerWidth ?? 0);

  React.useEffect(() => {
    console.log('LAYOUT WIDTH:', layoutWidth);
  }, [layoutWidth]);

  const brickData = React.useMemo(() => {
    console.log('MEMO BRK', {
      _0_data: data.length,
      _1_layoutWidth: layoutWidth,
      _2_numColumns: numColumns,
      _4_spacing: spacing,
    });

    if (!data) return [];

    const itemWidth = (layoutWidth - (numColumns + 1) * spacing) / numColumns;
    return data.map((item, index) => ({
      index,
      item,
      layout: {
        height: getBrickHeight(item, itemWidth),
        width: itemWidth,
      },
    }));
  }, [data, layoutWidth, numColumns, getBrickHeight, spacing]);

  const columnsData = React.useMemo(() => {
    console.log('MEMO COL', {
      _0_numColumns: numColumns,
      _1_brickData: brickData.length,
      _2_spacing: spacing,
    });

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
      { type: 'gutter', width: spacing } as MasonryListItem<ItemT>,
      ...columns.flatMap<MasonryListItem<ItemT>>(column => [
        { type: 'column', data: column },
        { type: 'gutter', width: spacing },
      ]),
    ];
  }, [numColumns, brickData, spacing]);

  return (
    <FlatList<MasonryListItem<ItemT>>
      {...restProps}
      ref={ref}
      data={columnsData}
      onLayout={e => {
        console.log(e.nativeEvent.layout);
        return setLayoutWidth(e.nativeEvent.layout.width);
      }}
      listKey="masonry-list-flat-list-root"
      keyExtractor={(_, index) => `masonry-list-flat-list-child-2-${index}`}
      contentContainerStyle={[
        { flexDirection: 'row', paddingVertical: spacing },
        debug && { backgroundColor: 'pink' },
      ]}
      renderItem={({ item, index: columnIndex }) => {
        console.log(`REND COL ${columnIndex} (${item.type})`);
        if (item.type === 'column') {
          return (
            <FlatList<Brick<ItemT>>
              removeClippedSubviews
              initialNumToRender={initialNumToRender ?? numColumns * 4}
              data={item.data}
              listKey={`masonry-list-flat-list-child-${columnIndex}`}
              key={`masonry-list-column-item-${columnIndex}`}
              keyExtractor={brick => `masonry-list-brick-${brick.index}`}
              style={[debug && { backgroundColor: 'lightgreen' }]}
              ItemSeparatorComponent={() => <Spacer.Vertical value={spacing} />}
              renderItem={({ item: brick, index: brickIndex }) => {
                return (
                  <View
                    key={
                      keyExtractor?.(brick.item, brick.index) ??
                      `masonry-list-brick-${columnIndex}-${brickIndex}`
                    }>
                    {renderItem({
                      index: brick.index,
                      item: brick.item,
                      layout: brick.layout,
                      column: columnIndex,
                    })}
                  </View>
                );
              }}
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

const MasonryList = React.forwardRef(MasonryListInner);
export default MasonryList;
