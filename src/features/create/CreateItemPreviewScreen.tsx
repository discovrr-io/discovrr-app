import * as React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

import storage from '@react-native-firebase/storage';
import { nanoid } from '@reduxjs/toolkit';
import { useSharedValue } from 'react-native-reanimated';

import { MediaSource } from 'src/api';
import { Button, Cell, LoadingOverlay } from 'src/components';
import { font, layout } from 'src/constants';
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

function uploadFileToFirebase(source: MediaSource) {
  const localFilePath = source.path ?? source.url;

  const fileId = nanoid();
  const isVideo = source.mime.includes('video');
  const extension = isVideo ? 'mp4' : 'jpg';
  const filename = `${fileId}.${extension}`;
  const storagePath = `/posts/${isVideo ? 'videos' : 'images'}/${filename}`;

  const reference = storage().ref(storagePath);
  const uploadTask = reference.putFile(localFilePath);

  return [filename, uploadTask, reference] as const;
}

export type CreateItemPreviewNavigationScreenParams =
  | { type: 'post'; contents: PostContents<MediaSource> }
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

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [overlayMessage, setOverlayMessage] = React.useState<string>();
  const [overlayCaption, setOverlayCaption] = React.useState<string>();

  const currentUploadProgress = useSharedValue(0);

  const renderPostContents = React.useCallback(() => {
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

  const handleSubmit = React.useCallback(
    async () => {
      const handleSubmitPost = async (postContents: PostContents) => {
        try {
          setIsSubmitting(true);

          let processedContents = postContents;
          if (postContents.type === 'text') {
            processedContents = postContents;
          } else if (postContents.type === 'gallery') {
            setIsUploading(true);
            setOverlayMessage('Uploading…');

            const sourcesLength = postContents.sources.length;
            const processedSources: MediaSource[] = [];

            // Upload files sequentially...
            for (let i = 0; i < sourcesLength; i++) {
              const index = i + 1;
              const source = postContents.sources[i];
              const [filename, task, reference] = uploadFileToFirebase(source);

              setOverlayCaption(`${index} of ${sourcesLength}`);
              console.log(
                $FUNC,
                `Uploading '${filename}' (${index} of ${sourcesLength})...`,
              );

              task.on('state_changed', snapshot => {
                const transferred = snapshot.bytesTransferred;
                const totalBytes = snapshot.totalBytes;
                const progress = Math.round((transferred / totalBytes) * 100);
                currentUploadProgress.value = transferred / totalBytes;
                console.log(
                  $FUNC,
                  `${filename}: ${transferred} of ${totalBytes} (${progress}%)`,
                );
              });

              await task.then(async () => {
                processedSources.push({
                  ...source,
                  filename,
                  url: await reference.getDownloadURL(),
                  path: undefined,
                });
              });
            }

            processedContents = { ...postContents, sources: processedSources };
          } else {
            throw new Error(`Unimplemented post type: ${postContents.type}`);
          }

          setIsUploading(false);
          setOverlayMessage('Creating post…');
          setOverlayCaption("This won't take long");
          const newPost = await dispatch(
            createPost(processedContents),
          ).unwrap();
          console.log($FUNC, 'Successfully created new post:', newPost);

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
    },
    // NOTE: Since we're just mutating `currentProgressProgress`, we don't need
    // to add it as a dependency. We don't need to observe `isMounted` as well.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, previewContent.type, previewContent.contents, props.navigation],
  );

  React.useLayoutEffect(() => {
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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: layout.spacing.lg,
          paddingHorizontal: layout.spacing.lg,
        }}>
        <View
          style={{
            flexGrow: 1,
            alignContent: 'center',
            justifyContent: 'center',
            marginBottom: layout.spacing.md,
          }}>
          {renderPostContents()}
        </View>
        <View>
          <Cell.Group label="Options">
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
        </View>
      </ScrollView>
      {isSubmitting && (
        <LoadingOverlay
          message={overlayMessage}
          caption={overlayCaption}
          progress={isUploading ? currentUploadProgress : undefined}
        />
      )}
    </SafeAreaView>
  );
}
