import * as React from 'react';
import { RefreshControl, StyleProp, ViewStyle } from 'react-native';

import { Card } from 'src/components';
import { Post } from 'src/models';
import { POSTS } from 'src/api/post';

import MasonryList from 'src/components/MasonryList.alt';
import { PostItemCardBody } from '../posts/PostItemCard';

const PAGINATION_LIMIT = 25;

type PostItemProps = {
  index: number;
  post: Post;
  style?: StyleProp<ViewStyle>;
};

function PostItem(props: PostItemProps) {
  console.log('REND POST ITEM', props.index, props.post.id);

  return (
    <Card elementOptions={{ smallContent: true }} style={props.style}>
      <Card.Body>
        {elementOptions => (
          <PostItemCardBody postBody={props.post} {...elementOptions} />
        )}
      </Card.Body>
    </Card>
  );
}

const MemoizedPostItem = React.memo(PostItem);

export default function DiscoverFeed() {
  console.log('REND DISCOVER FEED');

  const [posts, setPosts] = React.useState<Post[]>([]);
  const [shouldRefresh, setShouldRefresh] = React.useState(true);
  const [shouldFetchMore, setShouldFetchMore] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(0);
  const [didReachEnd, setDidReactEnd] = React.useState(false);

  React.useEffect(() => {
    if (!shouldRefresh) return;

    console.log('REFRESHING');
    const timer = setTimeout(() => {
      console.log('REFRESHING DONE');
      const newPosts = POSTS.slice(0, PAGINATION_LIMIT);
      setPosts(newPosts);
      setDidReactEnd(false);
      setCurrentPage(prev => prev + 1);
      setShouldRefresh(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [shouldRefresh]);

  React.useEffect(() => {
    if (!shouldFetchMore) return;

    console.log('FETCHING MORE');
    const timer = setTimeout(() => {
      console.log('FETCHING MORE DONE');
      const skipCount = (currentPage + 1) * PAGINATION_LIMIT;
      const newPosts = POSTS.slice(skipCount, skipCount + PAGINATION_LIMIT);

      if (newPosts.length === 0) {
        setDidReactEnd(true);
      } else {
        setCurrentPage(prev => prev + 1);
      }

      setPosts(prev => [...prev, ...newPosts]);
      setShouldFetchMore(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [shouldFetchMore, currentPage]);

  const handleRefresh = () => {
    if (!shouldRefresh && !shouldFetchMore) setShouldRefresh(true);
  };

  const handleFetchMore = () => {
    if (!shouldFetchMore && !didReachEnd) setShouldFetchMore(true);
  };

  return (
    <MasonryList
      data={posts}
      keyExtractor={post => post.id.toString()}
      onEndReached={handleFetchMore}
      onEndReachedThreshold={0.35}
      refreshControl={
        <RefreshControl refreshing={shouldRefresh} onRefresh={handleRefresh} />
      }
      getBrickHeight={(post, brickWidth) => {
        if (post.contents.type === 'gallery') {
          const thumbnail = post.contents.sources[0];
          const itemWidth = thumbnail.width ?? 1;
          const itemHeight = thumbnail.height ?? 1;
          return brickWidth * (itemHeight / itemWidth);
        } else if (post.contents.type === 'video') {
          const thumbnail = post.contents.source;
          const itemWidth = thumbnail.width ?? 1;
          const itemHeight = thumbnail.height ?? 1;
          return brickWidth * (itemHeight / itemWidth);
        } else {
          return 0;
        }
      }}
      renderItem={({ item: post, index, layout }) => (
        <MemoizedPostItem
          index={index}
          post={post}
          style={{ width: layout.width }}
        />
      )}
    />
  );
}
