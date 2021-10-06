import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl } from 'react-native';

import { color } from 'src/constants';
import { SOMETHING_WENT_WRONG } from 'src/constants/strings';
import { fetchAllPosts, selectPostIds } from 'src/features/posts/postsSlice';
import { fetchProfileById } from 'src/features/profiles/profilesSlice';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { PostId } from 'src/models';
import { Pagination } from 'src/models/common';

import {
  EmptyContainer,
  LoadingContainer,
  PostMasonryList,
} from 'src/components';

import FeedFooter from './FeedFooter';

const PAGINATION_LIMIT = 25;

export default function DiscoverFeed() {
  const $FUNC = '[DiscoverFeed]';
  const dispatch = useAppDispatch();

  const postIds = useAppSelector(selectPostIds) as PostId[];
  const isMounted = useIsMounted();

  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [_shouldFetchMore, _setShouldFetchMore] = useState(false);
  const [_currentPage, setCurrentPage] = useState(0);
  const [_didReachEnd, setDidReachEnd] = useState(false);

  useEffect(() => {
    if (isInitialRender || shouldRefresh)
      (async () => {
        try {
          console.log($FUNC, 'Fetching posts...');
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
          if (isMounted.current) {
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      })();
  }, [dispatch, isMounted, isInitialRender, shouldRefresh]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  return (
    <PostMasonryList
      smallContent
      postIds={postIds}
      refreshControl={
        !isInitialRender ? (
          <RefreshControl
            title="Loading your personalised feed..."
            tintColor={color.gray500}
            titleColor={color.gray700}
            refreshing={!isInitialRender && shouldRefresh}
            onRefresh={handleRefresh}
          />
        ) : undefined
      }
      ListEmptyComponent={
        isInitialRender ? (
          <LoadingContainer message="Loading your personalised feed..." />
        ) : (
          <EmptyContainer message="No one has posted anything yet. Be the first one!" />
        )
      }
      ListFooterComponent={
        postIds.length > 0 ? <FeedFooter didReachEnd /> : null
      }
    />
  );
}
