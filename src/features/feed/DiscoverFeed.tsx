import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, Text, View } from 'react-native';

import { EmptyContainer, PostMasonryList } from 'src/components';
import { color, font, layout } from 'src/constants';
import { SOMETHING_WENT_WRONG } from 'src/constants/strings';
import { fetchAllPosts, selectPostIds } from 'src/features/posts/postsSlice';
import { fetchProfileById } from 'src/features/profiles/profilesSlice';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { PostId } from 'src/models';
import { Pagination } from 'src/models/common';

const PAGINATION_LIMIT = 25;

export default function DiscoverFeed() {
  const $FUNC = '[DiscoverFeed]';
  const dispatch = useAppDispatch();

  const postIds = useAppSelector(selectPostIds) as PostId[];
  const isMounted = useIsMounted();

  const [shouldRefresh, setShouldRefresh] = useState(true);
  const [_shouldFetchMore, _setShouldFetchMore] = useState(false);
  const [_currentPage, setCurrentPage] = useState(0);
  const [_didReachEnd, setDidReachEnd] = useState(false);

  useEffect(() => {
    if (shouldRefresh)
      (async () => {
        try {
          setCurrentPage(0);
          setDidReachEnd(false);

          const pagination: Pagination = {
            limit: PAGINATION_LIMIT,
            currentPage: 0,
          };

          console.log($FUNC, `Fetching first ${PAGINATION_LIMIT} posts...`);
          const posts = await dispatch(
            fetchAllPosts({ pagination, reload: true }),
          ).unwrap();

          const profileIds = [...new Set(posts.map(post => post.profileId))];
          console.log($FUNC, 'Profiles to fetch:', profileIds);

          await Promise.all(
            profileIds.map(profileId =>
              dispatch(fetchProfileById({ profileId, reload: true })).unwrap(),
            ),
          );
        } catch (error) {
          console.error($FUNC, 'Failed to refresh posts:', error);
          Alert.alert(
            SOMETHING_WENT_WRONG.title,
            "We couldn't refresh your posts for you. Please try again later.",
          );
        } finally {
          console.log($FUNC, 'Finished refreshing posts');
          if (isMounted.current) setShouldRefresh(false);
        }
      })();
  }, [dispatch, isMounted, shouldRefresh]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  return (
    <PostMasonryList
      smallContent
      postIds={postIds}
      refreshControl={
        <RefreshControl
          title="Loading your personalised feed..."
          tintColor={color.gray500}
          titleColor={color.gray700}
          refreshing={shouldRefresh}
          onRefresh={handleRefresh}
        />
      }
      ListEmptyComponent={
        <EmptyContainer message="No one has posted anything yet. Be the first one!" />
      }
      ListFooterComponent={
        postIds.length > 0 ? (
          <View style={{ paddingVertical: layout.spacing.lg }}>
            <Text style={[font.largeBold, { textAlign: 'center' }]}>
              You&apos;re all caught up! 😎
            </Text>
          </View>
        ) : null
      }
    />
  );
}
