import React from 'react';
import { SafeAreaView, Text } from 'react-native';

import { useRoute } from '@react-navigation/core';
import { useDispatch, useSelector } from 'react-redux';

import { PostItemFooter } from '../../components/PostItem';
import { selectPostById } from './postsSlice';

export default function PostDetailScreen() {
  /** @type {{ postId?: string }} */
  const { postId = null } = useRoute().params || {};
  if (!postId) {
    console.warn('[PostDetailScreen] No post id given');
    return null;
  }

  /** @type {import('../../models').Post | undefined} */
  const post = useSelector((state) => selectPostById(state, postId));

  return (
    <SafeAreaView>
      <Text>{JSON.stringify(post)}</Text>
      <PostItemFooter
        post={post}
        options={{ largeIcons: true, showActions: true, showShareIcon: true }}
      />
    </SafeAreaView>
  );
}
