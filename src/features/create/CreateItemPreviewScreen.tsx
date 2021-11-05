import * as React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSharedValue } from 'react-native-reanimated';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as postsSlice from 'src/features/posts/posts-slice';
import * as productsSlice from 'src/features/products/products-slice';
import { MediaSource, ProductApi } from 'src/api';
import { Button, Cell, LoadingOverlay } from 'src/components';
import { useMyProfileId } from 'src/features/profiles/hooks';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { Profile } from 'src/models';
import { PostContents } from 'src/models/post';

import { PostItemCardPreview } from 'src/features/posts/PostItemCard';
import { ProductItemCardPreview } from 'src/features/products/ProductItemCard';

import {
  CreateItemStackScreenProps,
  RootStackNavigationProp,
} from 'src/navigation';

type __PostContents = PostContents<MediaSource>;
type __ProductContents = ProductApi.CreateProductParams;
type __WorkshopContents = any;

export type CreateItemPreviewNavigationScreenParams =
  | { type: 'post'; contents: __PostContents }
  | { type: 'product'; contents: __ProductContents }
  | { type: 'workshop'; contents: __WorkshopContents };

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
  const [overlayContent, setOverlayContent] = React.useState<{
    message?: string;
    caption?: string;
    isUploading?: boolean;
  }>({
    message: 'Getting ready…',
    caption: "This won't take long",
    isUploading: false,
  });

  const currentUploadProgress = useSharedValue(0);

  const renderCardPreview = React.useCallback(() => {
    switch (previewContent.type) {
      case 'post':
        return (
          <PostItemCardPreview
            contents={previewContent.contents}
            author={myProfileDetails}
            style={createItemPreviewScreenStyles.cardPreview}
          />
        );
      case 'product':
        return (
          <ProductItemCardPreview
            contents={previewContent.contents}
            author={myProfileDetails}
            style={createItemPreviewScreenStyles.cardPreview}
          />
        );
      default:
        return (
          <Text style={[constants.font.medium]}>
            {JSON.stringify(previewContent.contents)}
          </Text>
        );
    }
  }, [myProfileDetails, previewContent.type, previewContent.contents]);

  const renderOptions = React.useCallback(() => {
    switch (previewContent.type) {
      case 'post':
        return (
          <Cell.Group label="Options">
            <Cell.Navigator
              label="Add location"
              caption="No location set"
              onPress={() => utilities.alertUnavailableFeature()}
            />
            <Cell.Switch
              label="Enable comments"
              value={true}
              onValueChange={() => utilities.alertUnavailableFeature()}
            />
          </Cell.Group>
        );
      case 'product':
        return (
          <Cell.Group label="Options">
            <Cell.Navigator
              label="Add location"
              caption="No location set"
              onPress={() => utilities.alertUnavailableFeature()}
            />
          </Cell.Group>
        );

      default:
        return null;
    }
  }, [previewContent.type]);

  const handleSubmit = React.useCallback(
    async () => {
      const uploadMediaToFirebase = async (
        media: MediaSource[],
        generateStoragePath: utilities.GenerateStoragePath,
      ) => {
        const processedSources: MediaSource[] = [];

        for (let i = 0; i < media.length; i++) {
          const index = i + 1;
          const source = media[i];
          const [filename, task, reference] = utilities.uploadFileToFirebase(
            source,
            generateStoragePath,
          );

          setOverlayContent(prev => ({
            ...prev,
            caption: `${index} of ${media.length}`,
          }));

          console.log(
            $FUNC,
            `Uploading '${filename}' (${index} of ${media.length})...`,
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

        return processedSources;
      };

      const handleSubmitPost = async (postContents: __PostContents) => {
        let processedContents = postContents;
        if (postContents.type === 'text') {
          processedContents = postContents;
        } else if (postContents.type === 'gallery') {
          setOverlayContent(prev => ({
            ...prev,
            message: 'Uploading images…',
            isUploading: true,
          }));

          const processedSources = await uploadMediaToFirebase(
            postContents.sources,
            ({ filename, isVideo }) =>
              `/posts/${isVideo ? 'videos' : 'images'}/${filename}`,
          );

          processedContents = { ...postContents, sources: processedSources };
        } else {
          throw new Error(`Unimplemented post type: ${postContents.type}`);
        }

        setOverlayContent(prev => ({
          ...prev,
          message: 'Creating post…',
          caption: "This won't take long",
          isUploading: false,
        }));

        const createPostAction = postsSlice.createPost(processedContents);
        const newPost = await dispatch(createPostAction).unwrap();
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
      };

      const handleSubmitProduct = async (contents: __ProductContents) => {
        setOverlayContent(prev => ({
          ...prev,
          message: 'Uploading images…',
          isUploading: true,
        }));

        const processedSources = await uploadMediaToFirebase(
          contents.media,
          ({ filename }) => `/products/${filename}`,
        );

        setOverlayContent(prev => ({
          ...prev,
          message: 'Creating your product…',
          caption: "This won't take long",
          isUploading: false,
        }));

        const createProductParams = { ...contents, media: processedSources };
        const createProductAction =
          productsSlice.createProduct(createProductParams);
        const newProduct = await dispatch(createProductAction).unwrap();
        console.log($FUNC, 'Successfully created new product:', newProduct);

        // Pop off the `CreateItem` stack
        props.navigation.getParent<RootStackNavigationProp>().goBack();
        // Then navigate to the new post. We'll wait for a short period of time
        // to not make the screen jump instantly
        setTimeout(() => {
          props.navigation
            .getParent<RootStackNavigationProp>()
            .navigate('ProductDetails', {
              productId: newProduct.id,
              productName: newProduct.name,
            });
        }, 200);
      };

      try {
        setIsSubmitting(true);
        if (previewContent.type === 'post') {
          await handleSubmitPost(previewContent.contents);
        } else if (previewContent.type === 'product') {
          await handleSubmitProduct(previewContent.contents);
        } else {
          utilities.alertUnavailableFeature();
        }
      } catch (error) {
        console.error($FUNC, `Failed to submit ${previewContent.type}:`, error);
        utilities.alertSomethingWentWrong(
          `We weren't able to create your ${previewContent.type} at this time. Please try again later.`,
        );
      } finally {
        if (isMounted.current) setIsSubmitting(false);
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
          paddingVertical: constants.layout.spacing.lg,
          paddingHorizontal: constants.layout.spacing.lg,
        }}>
        <View
          style={{
            flexGrow: 1,
            alignContent: 'center',
            justifyContent: 'center',
            marginBottom: constants.layout.spacing.md,
          }}>
          {renderCardPreview()}
        </View>
        {renderOptions()}
      </ScrollView>
      {isSubmitting && (
        <LoadingOverlay
          message={overlayContent.message}
          caption={overlayContent.caption}
          progress={
            overlayContent.isUploading ? currentUploadProgress : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const createItemPreviewScreenStyles = StyleSheet.create({
  cardPreview: {
    maxWidth: '85%',
    alignSelf: 'center',
  },
});
