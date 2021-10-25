import React, { useCallback, useLayoutEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

import { Button, Cell } from 'src/components';
import { color, font, layout } from 'src/constants';
import { PostItemCardPreview } from 'src/features/posts/PostItemCard';
import { createPost } from 'src/features/posts/posts-slice';
import { useMyProfileId } from 'src/features/profiles/hooks';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { Profile } from 'src/models';
import { PostContents } from 'src/models/post';

import {
  CreateItemStackScreenProps,
  RootStackNavigationProp,
} from 'src/navigation';

import {
  alertSomethingWentWrong,
  alertUnavailableFeature,
} from 'src/utilities';

export type CreateItemPreviewNavigationScreenParams =
  | { type: 'post'; contents: PostContents }
  | { type: 'product'; contents: any }
  | { type: 'workshop'; contents: any };

type CreateItemPreviewScreenProps =
  CreateItemStackScreenProps<'CreateItemPreview'>;

export default function CreateItemPreviewScreen(
  props: CreateItemPreviewScreenProps,
) {
  const $FUNC = '[CreateItemPreviewScreen]';
  const previewContent = props.route.params;

  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();
  const myProfileId = useMyProfileId();
  const myProfileDetails: Pick<Profile, 'displayName' | 'avatar'> =
    useAppSelector(state => {
      if (!myProfileId) return { displayName: 'My Name' };
      return state.profiles.entities[myProfileId] ?? { displayName: 'My Name' };
    });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderPostContents = useCallback(() => {
    switch (previewContent.type) {
      case 'post':
        return (
          <PostItemCardPreview
            contents={previewContent.contents}
            author={myProfileDetails}
            style={{
              maxWidth: '85%',
              alignSelf: 'center',
            }}
          />
        );
      default:
        return <Text style={[font.medium]}>NOT IMPLEMENTED</Text>;
    }
  }, [myProfileDetails, previewContent.type, previewContent.contents]);

  const handleSubmit = useCallback(async () => {
    const handleSubmitPost = async (postContents: PostContents) => {
      try {
        setIsSubmitting(true);

        console.log($FUNC, 'Creating post...');
        const newPost = await dispatch(createPost(postContents)).unwrap();
        console.log($FUNC, 'Successfully created post');

        // Pop off the `CreateItem` stack
        props.navigation.getParent<RootStackNavigationProp>().goBack();
        // Then navigate to the new post. We'll wait for a short period of time
        // to not make the screen jump instantly
        setTimeout(() => {
          props.navigation
            .getParent<RootStackNavigationProp>()
            .navigate('PostDetails', { postId: newPost.id });
        }, 200);
      } catch (error) {
        console.error($FUNC, 'Failed to submit post:', error);
        alertSomethingWentWrong(
          "We weren't able to create your post at this time. Please try again later.",
        );
      } finally {
        if (isMounted.current) setIsSubmitting(false);
      }
    };

    if (previewContent.type === 'post') {
      await handleSubmitPost(previewContent.contents);
    } else {
      alertUnavailableFeature();
    }
  }, [
    dispatch,
    previewContent.type,
    previewContent.contents,
    props.navigation,
    isMounted,
  ]);

  useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <Button
          title="Post"
          type="primary"
          size="medium"
          loading={isSubmitting}
          onPress={handleSubmit}
        />
      ),
    });
  }, [props.navigation, handleSubmit, isSubmitting]);

  return (
    <SafeAreaView style={[layout.defaultScreenStyle, { flex: 1 }]}>
      <View style={{ flexGrow: 1, justifyContent: 'space-between' }}>
        <View
          style={{
            flexGrow: 1,
            paddingHorizontal: layout.spacing.md,
            paddingTop: layout.spacing.md,
          }}>
          <Text style={[font.medium, { color: color.gray700 }]}>
            Here&apos;s a preview of what your {props.route.params.type} post
            will look like to everyone:
          </Text>
          <ScrollView
            style={{ marginVertical: layout.spacing.md }}
            contentContainerStyle={{
              flexGrow: 1,
              alignContent: 'center',
              justifyContent: 'center',
            }}>
            {renderPostContents()}
          </ScrollView>
        </View>
      </View>
      <Cell.Group label="Post Options">
        <Cell.Navigator
          label="Add location"
          caption="No location set"
          onPress={() => alertUnavailableFeature()}
        />
        <Cell.Switch
          label="Enable comments"
          value={true}
          onValueChange={() => alertUnavailableFeature()}
        />
      </Cell.Group>
    </SafeAreaView>
  );
}
