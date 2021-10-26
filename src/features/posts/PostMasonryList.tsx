import React from 'react';

import { DEFAULT_TILE_SPACING } from 'src/constants/values';
import { MasonryList, MasonryListProps } from 'src/components';
import { PostId } from 'src/models';

import PostItemCard from './PostItemCard';
import { ScrollView } from 'react-native';

type PostMasonryListProps<ItemT> = Omit<
  MasonryListProps<ItemT>,
  'data' | 'renderItem'
> & {
  postIds: PostId[];
  tileSpacing?: number;
  smallContent?: boolean;
};

function PostMasonryListInner<ItemT>(
  props: PostMasonryListProps<ItemT>,
  ref: React.ForwardedRef<ScrollView>,
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
      ref={ref}
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

const PostMasonryList = React.forwardRef(PostMasonryListInner);

export default PostMasonryList;
