import * as React from 'react';
import { RefreshControl } from 'react-native';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as authSlice from 'src/features/authentication/auth-slice';
import * as feedSlice from 'src/features/feed/feed-slice';
import * as postsSlice from 'src/features/posts/posts-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';

import {
  EmptyContainer,
  LoadingContainer,
  SignInHeaderCard,
} from 'src/components';

import {
  useAppDispatch,
  useAppSelector,
  useExtendedTheme,
  useIsMounted,
} from 'src/hooks';

import FeedFooter from './FeedFooter';
import PostMasonryList from 'src/features/posts/PostMasonryList';
import { PostId } from 'src/models';

const PAGINATION_LIMIT = 25;

export default function DiscoverFeed() {
  const $FUNC = '[DiscoverFeed]';
  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();
  const { colors } = useExtendedTheme();

  const postIds = useAppSelector(state => state.feed.ids);
  const currentUser = useAppSelector(authSlice.selectCurrentUser);

  const [isInitialRender, setIsInitialRender] = React.useState(true);
  const [shouldRefresh, setShouldRefresh] = React.useState(false);
  const [shouldFetchMore, setShouldFetchMore] = React.useState(false);

  const [pagination, setPagination] = React.useState<{
    index: number;
    didReachEnd: boolean;
    oldestDateFetched?: string;
  }>({ index: 0, didReachEnd: false });

  React.useEffect(
    () => {
      async function fetchPosts() {
        try {
          console.log($FUNC, `Fetching first ${PAGINATION_LIMIT} posts...`);
          setPagination({ index: 0, didReachEnd: false });

          const refreshedPosts = await dispatch(
            postsSlice.fetchAllPosts({
              reload: true,
              pagination: {
                limit: PAGINATION_LIMIT,
                currentPage: 0,
              },
            }),
          ).unwrap();

          const profileIds = refreshedPosts.map(post => post.profileId);
          const uniqueProfileIds = [...new Set(profileIds)];
          console.log($FUNC, 'Profiles to fetch:', uniqueProfileIds);

          await Promise.all(
            uniqueProfileIds.map(profileId =>
              dispatch(
                profilesSlice.fetchProfileById({ profileId, reload: true }),
              ).unwrap(),
            ),
          );

          if (refreshedPosts.length === 0) {
            console.log($FUNC, 'No more posts to fetch');
            setPagination(prev => ({ ...prev, didReachEnd: true }));
          } else {
            setPagination(prev => ({
              ...prev,
              index: prev.index + 1,
              oldestDateFetched:
                refreshedPosts[refreshedPosts.length - 1].createdAt,
            }));
          }

          dispatch(
            feedSlice.refreshFeed(
              refreshedPosts.map(post => ({
                postId: post.id,
                createdAt: post.createdAt,
              })),
            ),
          );

          console.log($FUNC, 'Finished refreshing posts');
        } catch (error) {
          console.error($FUNC, 'Failed to refresh posts:', error);
          utilities.alertSomethingWentWrong(
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

          const nextPosts = await dispatch(
            postsSlice.fetchMorePosts({
              pagination: {
                limit: PAGINATION_LIMIT,
                currentPage: pagination.index,
              },
            }),
          ).unwrap();

          const profileIds = nextPosts.map(post => post.profileId);
          const uniqueProfileIds = [...new Set(profileIds)];
          console.log($FUNC, 'Profiles to fetch:', uniqueProfileIds);

          await Promise.all(
            uniqueProfileIds.map(profileId =>
              dispatch(profilesSlice.fetchProfileById({ profileId })),
            ),
          );

          if (nextPosts.length < PAGINATION_LIMIT) {
            console.log($FUNC, 'No more posts to fetch');
            setPagination(prev => ({ ...prev, didReachEnd: true }));
          } else {
            setPagination(prev => ({
              ...prev,
              index: prev.index + 1,
              oldestDateFetched: nextPosts[nextPosts.length - 1].createdAt,
            }));
          }

          dispatch(
            feedSlice.addPostIdsToFeed(
              nextPosts.map(post => ({
                postId: post.id,
                createdAt: post.createdAt,
              })),
            ),
          );

          console.log($FUNC, 'Finished fetching more posts');
        } catch (error) {
          console.error($FUNC, 'Failed to fetch more posts:', error);
          utilities.alertSomethingWentWrong(
            'We weren’t able to fetch more posts. Please try again later.',
          );
        } finally {
          if (isMounted.current) {
            if (shouldFetchMore) setShouldFetchMore(false);
          }
        }
      }

      if (shouldFetchMore && !pagination.didReachEnd) fetchMorePosts();
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
      !isInitialRender &&
      !shouldRefresh &&
      !pagination.didReachEnd
    ) {
      setShouldFetchMore(true);
    }
  };

  return (
    <PostMasonryList
      smallContent
      postIds={postIds as PostId[]}
      onEndReachedThreshold={pagination.index === 0 ? 0.5 : 0.25}
      onEndReached={handleFetchMore}
      refreshControl={
        <RefreshControl
          tintColor={colors.caption}
          refreshing={postIds.length > 0 && (isInitialRender || shouldRefresh)}
          onRefresh={handleRefresh}
        />
      }
      ListHeaderComponent={
        !currentUser ? (
          <SignInHeaderCard
            style={{ marginBottom: constants.layout.spacing.xs }}
          />
        ) : null
      }
      ListEmptyComponent={
        isInitialRender ? (
          <LoadingContainer message="Loading your feed..." />
        ) : (
          <EmptyContainer message="No one has posted anything yet. Be the first one!" />
        )
      }
      ListFooterComponent={
        !isInitialRender && postIds.length > 0 ? (
          <FeedFooter didReachEnd={pagination.didReachEnd} />
        ) : undefined
      }
    />
  );
}
