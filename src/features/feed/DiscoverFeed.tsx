import * as React from 'react';
import { RefreshControl } from 'react-native';

import * as constants from 'src/constants';
import * as postsSlice from 'src/features/posts/posts-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { useAppDispatch, useIsMounted } from 'src/hooks';
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

  const [postIds, setPostIds] = React.useState<PostId[]>([]);
  const isMounted = useIsMounted();

  const [isInitialRender, setIsInitialRender] = React.useState(true);
  const [shouldRefresh, setShouldRefresh] = React.useState(false);
  const [shouldFetchMore, setShouldFetchMore] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(0);
  const [didReachEnd, setDidReachEnd] = React.useState(false);

  React.useEffect(
    () => {
      async function fetchPosts() {
        try {
          console.log($FUNC, `Fetching first ${PAGINATION_LIMIT} posts...`);
          setCurrentPage(0);
          setDidReachEnd(false);

          const pagination: Pagination = {
            limit: PAGINATION_LIMIT,
            currentPage: 0,
          };

          const refreshedPosts = await dispatch(
            postsSlice.fetchAllPosts({ pagination, reload: true }),
          ).unwrap();

          // Don't include "Anonymous" profiles
          const filteredProfileIds = refreshedPosts
            .map(post => post.profileId)
            .filter(Boolean);

          const profileIds = [...new Set(filteredProfileIds)];
          console.log($FUNC, 'Profiles to fetch:', profileIds);

          await Promise.all(
            profileIds.map(profileId =>
              dispatch(
                profilesSlice.fetchProfileById({ profileId, reload: true }),
              ).unwrap(),
            ),
          );

          if (refreshedPosts.length === 0) {
            console.log($FUNC, 'No more posts to fetch');
            setDidReachEnd(true);
          } else {
            setCurrentPage(prev => prev + 1);
          }

          setPostIds(refreshedPosts.map(post => post.id));
          console.log($FUNC, 'Finished refreshing posts');
        } catch (error) {
          console.error($FUNC, 'Failed to refresh posts:', error);
          alertSomethingWentWrong(
            "We weren't able to refresh this page. Please try again later.",
          );
        } finally {
          if (isMounted.current) {
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      }

      if (isInitialRender || shouldRefresh) fetchPosts();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, isInitialRender, shouldRefresh],
  );

  React.useEffect(
    () => {
      async function fetchMorePosts() {
        try {
          console.log($FUNC, `Fetching next ${PAGINATION_LIMIT} posts...`);

          const pagination: Pagination = {
            limit: PAGINATION_LIMIT,
            currentPage,
          };

          const nextPosts = await dispatch(
            postsSlice.fetchMorePosts({ pagination }),
          ).unwrap();

          const filteredProfileIds = nextPosts
            .map(post => post.profileId)
            .filter(Boolean);

          const profileIds = [...new Set(filteredProfileIds)];
          console.log($FUNC, 'Profiles to fetch:', profileIds);

          await Promise.all(
            profileIds.map(profileId =>
              dispatch(profilesSlice.fetchProfileById({ profileId })),
            ),
          );

          if (nextPosts.length === 0) {
            console.log($FUNC, 'No more posts to fetch');
            setDidReachEnd(nextPosts.length === 0);
          } else {
            setCurrentPage(prev => prev + 1);
          }

          setPostIds(prev => [...prev, ...nextPosts.map(post => post.id)]);
          console.log($FUNC, 'Finished fetching more posts');
        } catch (error) {
          console.error($FUNC, 'Failed to fetch more posts:', error);
          alertSomethingWentWrong(
            "We weren't able to fetch more posts. Please try again later.",
          );
        } finally {
          if (isMounted.current) {
            if (shouldFetchMore) setShouldFetchMore(false);
          }
        }
      }

      if (shouldFetchMore && !didReachEnd) fetchMorePosts();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, shouldFetchMore],
  );

  const handleRefresh = () => {
    if (!shouldRefresh && !isInitialRender && !shouldFetchMore) {
      setShouldRefresh(true);
    }
  };

  const handleFetchMore = () => {
    if (
      !shouldFetchMore &&
      !didReachEnd &&
      !isInitialRender &&
      !shouldRefresh
    ) {
      setShouldFetchMore(true);
    }
  };

  return (
    <PostMasonryList
      smallContent
      postIds={postIds}
      onEndReachedThreshold={currentPage === 0 ? 0.5 : 0.25}
      onEndReached={handleFetchMore}
      refreshControl={
        <RefreshControl
          tintColor={constants.color.gray500}
          refreshing={postIds.length > 0 && (isInitialRender || shouldRefresh)}
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
