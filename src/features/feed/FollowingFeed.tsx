import React from 'react';
import { FlatList } from 'react-native';
import { EmptyContainer } from 'src/components';
import { layout } from 'src/constants';

import PostItemCard from 'src/features/posts/PostItemCard';

import { selectCurrentUserProfileId } from 'src/features/authentication/auth-slice';
import { selectFollowingPosts } from 'src/features/posts/posts-slice';
import { useAppSelector } from 'src/hooks';

const TILE_SPACING = layout.defaultScreenMargins.horizontal;

export default function FollowingFeed() {
  const userProfileId = useAppSelector(selectCurrentUserProfileId);

  const followingPostIds = useAppSelector(state => {
    if (!userProfileId) {
      // console.warn('Current user is undefined. Are you signed in?');
      return [];
    }

    return selectFollowingPosts(state, userProfileId).map(post => post.id);
  });

  return (
    <FlatList
      data={followingPostIds}
      keyExtractor={postId => String(postId)}
      indicatorStyle="black"
      contentContainerStyle={{
        flexGrow: 1,
        paddingVertical: layout.defaultScreenMargins.vertical,
        paddingHorizontal: TILE_SPACING,
      }}
      ListEmptyComponent={
        <EmptyContainer message="Follow someone to see their posts here." />
      }
      renderItem={({ item: postId }) => (
        <PostItemCard
          showRepliesIcon
          postId={postId}
          style={{ marginBottom: TILE_SPACING }}
        />
      )}
    />
  );
}
