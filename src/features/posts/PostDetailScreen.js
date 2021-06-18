import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useRoute } from '@react-navigation/core';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { PostItemFooter } from '../../components/PostItem';
import { selectPostById } from './postsSlice';
import { colors, typography, values } from '../../constants';
import { Button } from '../../components';

export default function PostDetailScreen() {
  const navigation = useNavigation();

  /** @type {{ postId?: string }} */
  const { postId = null } = useRoute().params || {};
  if (!postId) {
    console.warn('[PostDetailScreen] No post id given');
    return null;
  }

  /** @type {import('../../models').Post | undefined} */
  const post = useSelector((state) => selectPostById(state, postId));

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={[errorStyles.container]}>
          <Text style={[errorStyles.emoji]}>😓</Text>
          <Text style={[errorStyles.heading]}>Oops!</Text>
          <Text style={[errorStyles.caption]}>
            We couldn't load this page because the link you gave us doesn't seem
            to be right.
          </Text>
          <Button
            primary
            size="small"
            title="Take Me Back"
            onPress={() => navigation.navigate('HomeScreen')}
            style={[errorStyles.button]}
          />
        </View>
      </SafeAreaView>
    );
  }

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

const commonErrorStyles = {
  textAlign: 'center',
};

const errorStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: values.spacing.xxl,
  },
  emoji: {
    ...commonErrorStyles,
    fontSize: typography.size.h2 * 1.5,
    textAlign: 'center',
  },
  heading: {
    ...commonErrorStyles,
    fontSize: typography.size.h4,
    fontWeight: '600',
    marginTop: values.spacing.sm,
    marginBottom: values.spacing.md,
  },
  caption: {
    ...commonErrorStyles,
    fontSize: typography.size.md,
  },
  button: {
    marginTop: values.spacing.md * 1.5,
    width: '50%',
  },
});
