import * as React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import Config from 'react-native-config';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import { useSharedValue } from 'react-native-reanimated';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as postsSlice from 'src/features/posts/posts-slice';
import * as productsSlice from 'src/features/products/products-slice';
import { MediaSource, ProductApi } from 'src/api';
import { Banner, Button, Cell, LoadingOverlay } from 'src/components';
import { useMyProfileId } from 'src/features/profiles/hooks';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { Profile } from 'src/models';
import { PostContents } from 'src/models/post';

import { PostItemCardPreview } from 'src/features/posts/PostItemCard';
import { ProductItemCardPreview } from 'src/features/products/ProductItemCard';

import {
  CreateItemStackScreenProps,
  RootStackNavigationProp,
  RootStackParamList,
} from 'src/navigation';

const COMPRESSED_VIDEO_WIDTH = 400;

const SQUARESPACE_PIOT_KEY = Config.SQUARESPACE_PIOT_KEY || '';
const SQUARESPACE_URL = 'https://api.squarespace.com/1.0/commerce';

type __PostContents = PostContents<MediaSource>;

type __ProductContents = ProductApi.CreateProductParams & {
  /**
   * Images to be uploaded to Squarespace.
   */
  squarespaceImages: MediaSource[];
};

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
  const myProfileDetails: Pick<
    Profile,
    'displayName' | 'avatar' | 'highestRole'
  > = useAppSelector(state => {
    const defaultDetails = { displayName: 'My Name', highestRole: 'user' };
    if (!myProfileId) return defaultDetails;
    const foundProfile = state.profiles.entities[myProfileId];
    if (!foundProfile) return defaultDetails;
    return { ...foundProfile, displayName: foundProfile.__publicName };
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [overlayContent, setOverlayContent] = React.useState<{
    message?: string;
    caption?: string;
    isUploading?: boolean;
    canCancel?: boolean;
  }>({
    message: 'Getting ready…',
    caption: "This won't take long",
    isUploading: false,
    canCancel: false,
  });

  const currentUploadProgress = useSharedValue(0);

  const handleSubmit = React.useCallback(
    async () => {
      async function uploadImagesToFirebase(
        images: MediaSource[],
        generateStoragePath: utilities.GenerateStoragePath,
      ): Promise<MediaSource[]> {
        setOverlayContent({
          message: 'Uploading images…',
          caption: 'This may take a while',
          isUploading: true,
        });

        const processedSources: MediaSource[] = [];

        for (let i = 0; i < images.length; i++) {
          const index = i + 1;
          const source = images[i];
          const [filename, task, reference] =
            utilities.createFirebaseUploadFileTask(source, generateStoragePath);

          setOverlayContent(prev => ({
            ...prev,
            caption: `${index} of ${images.length}`,
          }));

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
              url: await reference.getDownloadURL(),
              filename,
              path: reference.fullPath,
            });
          });
        }

        return processedSources;
      }

      async function uploadVideoToFirebase(
        video: MediaSource,
        generateStoragePath: utilities.GenerateStoragePath,
      ): Promise<MediaSource> {
        setOverlayContent({
          message: 'Compressing video…',
          caption: 'This may take a while',
          canCancel: true,
        });

        const timer = setTimeout(() => {
          if (isMounted.current)
            setOverlayContent(prev => ({
              ...prev,
              caption: 'This is taking longer than usual…',
            }));
        }, 20 * 1000);

        const compressedVideo = await utilities.compressVideo(
          video,
          COMPRESSED_VIDEO_WIDTH,
        );

        clearTimeout(timer);

        setOverlayContent({
          message: 'Uploading video…',
          caption: 'This may take a while',
          isUploading: true,
        });

        const [videoFilename, videoTask, videoReference] =
          utilities.createFirebaseUploadFileTask(
            compressedVideo,
            generateStoragePath,
          );

        videoTask.on('state_changed', snapshot => {
          const transferred = snapshot.bytesTransferred;
          const totalBytes = snapshot.totalBytes;
          currentUploadProgress.value = transferred / totalBytes;
        });

        return await videoTask.then(async () => ({
          ...compressedVideo,
          url: await videoReference.getDownloadURL(),
          filename: videoFilename,
          path: videoReference.fullPath,
        }));
      }

      async function handleSubmitPost(
        postContents: __PostContents,
      ): Promise<RootStackParamList['PostDetails']> {
        let processedContents = postContents;
        if (postContents.type === 'text') {
          processedContents = postContents;
        } else if (postContents.type === 'gallery') {
          const processedSources = await uploadImagesToFirebase(
            postContents.sources,
            ({ filename }) => `/posts/images/${filename}`,
          );

          processedContents = { ...postContents, sources: processedSources };
        } else {
          const processedVideo = await uploadVideoToFirebase(
            postContents.source,
            ({ filename }) => `/posts/videos/${filename}`,
          );

          let processedThumbnail: MediaSource | undefined = undefined;
          if (postContents.thumbnail) {
            setOverlayContent({
              message: 'Uploading thumbnail…',
              caption: 'This may take a while',
              isUploading: true,
            });

            const [thumbnailFilename, thumbnailTask, thumbnailReference] =
              utilities.createFirebaseUploadFileTask(
                postContents.thumbnail,
                ({ fileId }) => `posts/thumbnails/${fileId}.gif`,
              );

            thumbnailTask.on('state_changed', snapshot => {
              const transferred = snapshot.bytesTransferred;
              const totalBytes = snapshot.totalBytes;
              currentUploadProgress.value = transferred / totalBytes;
            });

            await thumbnailTask.then(async () => {
              // @ts-ignore
              processedThumbnail = {
                ...postContents.thumbnail,
                url: await thumbnailReference.getDownloadURL(),
                filename: thumbnailFilename,
                path: thumbnailReference.fullPath,
              };
            });
          }

          // TODO: Clear the thumbnails folder when video post successfully submit
          processedContents = {
            ...postContents,
            source: processedVideo,
            thumbnail: processedThumbnail,
          };
        }

        setOverlayContent({
          message: 'Creating post…',
          isUploading: false,
        });

        const createPostAction = postsSlice.createPost(processedContents);
        const newPost = await dispatch(createPostAction).unwrap();
        console.log($FUNC, 'Successfully created new post:', newPost);

        return { postId: newPost.id };
      }

      async function handleSubmitProduct(
        contents: __ProductContents,
      ): Promise<RootStackParamList['ProductDetails']> {
        setOverlayContent({
          message: 'Creating your product…',
        });

        const { squarespaceImages, ...createProductParams } = contents;
        const createProductAction =
          productsSlice.createProduct(createProductParams);
        const newProduct = await dispatch(createProductAction).unwrap();
        console.log($FUNC, 'Successfully created new product:', newProduct);

        if (newProduct.squarespaceId) {
          console.log($FUNC, 'Uploading images to Squarespace...');

          setOverlayContent({
            message: 'Uploading images…',
            caption: 'This may take a while',
            isUploading: true,
          });

          // Squarespace only allows uploading one image at a time
          for (let i = 0; i < squarespaceImages.length; i++) {
            const index = i + 1;
            const image = squarespaceImages[i];

            const filename =
              image.filename ||
              image.path?.slice(image.path.lastIndexOf('/') + 1) ||
              image.url.slice(image.url.lastIndexOf('/') + 1);

            setOverlayContent(prev => ({
              ...prev,
              caption: `${index} of ${squarespaceImages.length}`,
            }));

            await ReactNativeBlobUtil.fetch(
              'POST',
              `${SQUARESPACE_URL}/products/${newProduct.squarespaceId}/images`,
              {
                Authorization: `Bearer ${SQUARESPACE_PIOT_KEY}`,
                'User-Agent': `DiscovrrApp/${constants.values.APP_VERSION}`,
                'Content-Type': 'multipart/form-data',
              },
              [
                {
                  filename,
                  name: 'file',
                  data: ReactNativeBlobUtil.wrap(
                    image.path || image.url.replace('file://', ''),
                  ),
                },
              ],
            ).uploadProgress((written, total) => {
              currentUploadProgress.value = written / total;
            });
          }
        }

        return { productId: newProduct.id, productName: newProduct.name };
      }

      async function deleteTemporaryFiles() {
        let thumbnails: RNFS.ReadDirItem[] = [];
        if (await RNFS.exists(utilities.getThumbnailOutputDirectory())) {
          thumbnails = await RNFS.readDir(
            utilities.getThumbnailOutputDirectory(),
          );
        }

        let videos: RNFS.ReadDirItem[] = [];
        if (await RNFS.exists(utilities.getCompressedVideoOutputDirectory())) {
          videos = await RNFS.readDir(
            utilities.getCompressedVideoOutputDirectory(),
          );
        }

        await Promise.all(
          thumbnails.concat(videos).map(async file => {
            console.log($FUNC, 'UNLINK:', file.name);
            await RNFS.unlink(file.path);
          }),
        );
      }

      try {
        setIsSubmitting(true);
        currentUploadProgress.value = 0;

        if (previewContent.type === 'post') {
          const params = await handleSubmitPost(previewContent.contents);
          const nav = props.navigation.getParent<RootStackNavigationProp>();
          nav.goBack(); // Pop off the `CreateItem` stack
          nav.navigate('PostDetails', params);
        } else if (previewContent.type === 'product') {
          const params = await handleSubmitProduct(previewContent.contents);
          const nav = props.navigation.getParent<RootStackNavigationProp>();
          nav.goBack(); // Pop off the `CreateItem` stack
          nav.navigate('ProductDetails', params);
        } else {
          utilities.alertUnavailableFeature();
          return;
        }

        await deleteTemporaryFiles();
      } catch (error: any) {
        if (error.getValue && ReturnCode.isCancel(error)) {
          console.warn('FFmpeg task successfully cancelled');
        } else {
          console.error(
            $FUNC,
            `Failed to submit ${previewContent.type}:`,
            error,
          );
          utilities.alertSomethingWentWrong(
            error.message ||
              `We weren't able to create your ${previewContent.type} at this ` +
                'time. Please try again later.',
          );
        }
      } finally {
        if (isMounted.current) setIsSubmitting(false);
      }
    },
    // NOTE: Since we're just mutating `currentUploadProgress`, we don't need
    // to add it as a dependency. We don't need to observe `isMounted` too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, previewContent.type, previewContent.contents, props.navigation],
  );

  const handleCancel = React.useCallback(async () => {
    console.log('Cancelling tasks...');
    await FFmpegKit.cancel();
  }, []);

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

  const renderCardPreview = React.useCallback(() => {
    switch (previewContent.type) {
      case 'post':
        return (
          <PostItemCardPreview
            contents={{ ...previewContent.contents }}
            author={myProfileDetails}
            preferredMediaAspectRatio={
              previewContent.contents.type === 'video' ? 2 / 3 : undefined
            }
            style={createItemPreviewScreenStyles.cardPreview}
          />
        );
      case 'product':
        return (
          <ProductItemCardPreview
            contents={{
              ...previewContent.contents,
              media: previewContent.contents.squarespaceImages,
            }}
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
            {/* These need to be separated to render the divider */}
            {previewContent.contents.type === 'video' && (
              <Cell.Switch
                label="Loop video"
                value={true}
                onValueChange={() => utilities.alertUnavailableFeature()}
              />
            )}
            {previewContent.contents.type === 'video' && (
              <Cell.Switch
                label="Mute video"
                value={false}
                onValueChange={() => utilities.alertUnavailableFeature()}
              />
            )}
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
  }, [previewContent.type, previewContent.contents.type]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: constants.layout.spacing.lg,
          paddingHorizontal: constants.layout.spacing.lg,
        }}>
        {previewContent.type !== 'post' &&
          myProfileDetails.highestRole !== 'verified-vendor' && (
            <Banner
              title="You're not a verified vendor yet"
              caption="Your product won't be visible to anyone until we verify you. To be verified, start by posting this product. We'll let you know of the outcome shortly."
            />
          )}
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
          onCancel={overlayContent.canCancel ? handleCancel : undefined}
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
