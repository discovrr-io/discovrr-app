import storage from '@react-native-firebase/storage';
import { nanoid } from '@reduxjs/toolkit';

import { MediaSource } from 'src/api';

type GenerateStoragePathConfig = {
  /** The name of the new file, including the extension. */
  filename: string;
  /** Whether the `mime` of the given source contains the string `"video"`. */
  isVideo: boolean;
  /** The name of the new file, WITHOUT the extension. */
  fileId: string;
  /** The file extension of the new file, without the dot (e.g. `"jpg"` or `"mp4"`). */
  fileExtension: string;
};

export type GenerateStoragePath = (config: GenerateStoragePathConfig) => string;

export function createFirebaseUploadFileTask(
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
