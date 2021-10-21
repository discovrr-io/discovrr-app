import React from 'react';

import { DEFAULT_TILE_SPACING } from 'src/constants/values';
import { MasonryList, MasonryListProps } from 'src/components';
import { PostId } from 'src/models';

import PostItemCard from './PostItemCard';

type PostMasonryListProps<ItemT> = Omit<
  MasonryListProps<ItemT>,
  'data' | 'renderItem'
> & {
  postIds: PostId[];
  tileSpacing?: number;
  smallContent?: boolean;
};

export default function PostMasonryList<ItemT>(
  props: PostMasonryListProps<ItemT>,
) {
  const {
    postIds,
    tileSpacing = DEFAULT_TILE_SPACING,
    smallContent = false,
    contentContainerStyle,
    ...restProps
  } = props;

  return (
    <MasonryList
      {...restProps}
      data={postIds}
      contentContainerStyle={[
        postIds.length === 0 && { flexGrow: 1 },
        contentContainerStyle,
      ]}
      renderItem={({ item: postId, column }) => (
        <PostItemCard
          postId={postId}
          key={postId}
          elementOptions={{ smallContent }}
          style={{
            marginTop: tileSpacing,
            marginLeft: column % 2 === 0 ? tileSpacing : tileSpacing / 2,
            marginRight: column % 2 !== 0 ? tileSpacing : tileSpacing / 2,
          }}
        />
      )}
    />
  );
}
