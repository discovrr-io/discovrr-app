import storage from '@react-native-firebase/storage';
import { Image, Video } from 'react-native-image-crop-picker';
import { nanoid } from '@reduxjs/toolkit';

import { MediaSource } from 'src/api';

type GenerateStoragePathConfig = {
  /** The name of the new file, including the extension. */
  filename: string;
  /** Whether the `mime` of the given source contains the string `"video"`. */
  isVideo: boolean;
  /** The name of the new file, WITHOUT the extension. */
  fileId: string;
  /** The file extension of the new file. */
  fileExtension: string;
};

export type GenerateStoragePath = (config: GenerateStoragePathConfig) => string;

export function createUploadFileToFirebaseTask(
  source: MediaSource,
  generateStoragePath: GenerateStoragePath,
) {
  // We should have path defined, but we'll set it to url just in case.
  const localFilePath = source.path ?? source.url;

  const fileId = nanoid();
  const isVideo = source.mime.includes('video');
  const extension = isVideo ? 'mp4' : 'jpg';
  const filename = `${fileId}.${extension}`;
  const storagePath = generateStoragePath({
    filename,
    isVideo,
    fileId,
    fileExtension: extension,
  });

  const reference = storage().ref(storagePath);
  const uploadTask = reference.putFile(localFilePath);

  return [filename, uploadTask, reference] as const;
}

export function mapImageToMediaSource(image: Image): MediaSource {
  return {
    mime: image.mime,
    url: image.path,
    size: image.size,
    width: image.width,
    height: image.height,
  };
}

export function mapVideoToMediaSource(video: Video): MediaSource {
  return {
    ...mapImageToMediaSource(video),
    // Prefer higher quality source URL (only available on iOS)
    url: video.sourceURL ?? video.path,
    duration: video.duration,
  };
}
