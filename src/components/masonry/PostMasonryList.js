import React from 'react';

import MasonryList from './MasonryList';
import PostItemCard from '../../features/posts/PostItemCard';
import { values } from '../../constants';

/**
 * @typedef {import('./MasonryList').MasonryListProps<PostId>} MasonryListProps
 * @typedef {Omit<MasonryListProps, 'data' | 'renderItem'>} RestProps
 *
 * @typedef {import('../../models').PostId} PostId
 * @typedef {{ postIds: PostId[], tileSpacing?: number, smallContent?: boolean, showFooter?: boolean }} PostMasonryListProps
 *
 * @param {PostMasonryListProps & RestProps} param0
 * @returns
 */
export default function PostMasonryList({
  postIds,
  tileSpacing = values.spacing.sm * 1.25,
  smallContent,
  showFooter,
  ...props
}) {
  return (
    <MasonryList
      {...props}
      data={postIds}
      renderItem={({ item: postId, index }) => (
        <PostItemCard
          postId={postId}
          key={postId}
          smallContent={smallContent}
          showFooter={showFooter}
          style={{
            marginTop: tileSpacing,
            marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
            marginRight: index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
            marginBottom: values.spacing.sm,
          }}
        />
      )}
    />
  );
}
