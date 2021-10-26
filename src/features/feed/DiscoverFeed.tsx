import React, { useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';

import { color } from 'src/constants';
import { fetchAllPosts, selectPostIds } from 'src/features/posts/posts-slice';
import { fetchProfileById } from 'src/features/profiles/profiles-slice';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { PostId } from 'src/models';
import { Pagination } from 'src/models/common';
import { alertSomethingWentWrong } from 'src/utilities';

import { EmptyContainer, LoadingContainer } from 'src/components';

import FeedFooter from './FeedFooter';
import PostMasonryList from 'src/features/posts/PostMasonryList';

const PAGINATION_LIMIT = 25;

export default function DiscoverFeed() {
  const $FUNC = '[DiscoverFeed]';
  const dispatch = useAppDispatch();

  const postIds = useAppSelector(selectPostIds) as PostId[];
  const isMounted = useIsMounted();

  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const [_, setCurrentPage] = useState(0);
  const [didReachEnd, setDidReachEnd] = useState(false);

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

          console.log($FUNC, 'Finished refreshing posts');
        } catch (error) {
          console.error($FUNC, 'Failed to refresh posts:', error);
          alertSomethingWentWrong(
            "We weren't able to refresh this page. Please try again later.",
          );
        } finally {
          if (isMounted.current) {
            setDidReachEnd(true); // TEMPORARY
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      })();
  }, [dispatch, isMounted, isInitialRender, shouldRefresh]);

  const handleRefresh = () => {
    if (!isInitialRender && !shouldRefresh) setShouldRefresh(true);
  };

  return (
    <PostMasonryList
      smallContent
      postIds={postIds}
      refreshControl={
        <RefreshControl
          tintColor={color.gray500}
          refreshing={postIds.length > 0 && shouldRefresh}
          onRefresh={handleRefresh}
        />
      }
      ListEmptyComponent={
        isInitialRender ? (
          <LoadingContainer message="Loading your personalised feed..." />
        ) : (
          <EmptyContainer message="No one has posted anything yet. Be the first one!" />
        )
      }
      ListFooterComponent={
        !isInitialRender && postIds.length > 0 ? (
          <FeedFooter didReachEnd={didReachEnd} />
        ) : undefined
      }
    />
  );
}
