import storage from '@react-native-firebase/storage';
import { nanoid } from '@reduxjs/toolkit';

import { MediaSource } from 'src/api';

type GenerateStoragePathConfig = { filename: string; isVideo: boolean };

export function uploadFileToFirebase(
  source: MediaSource,
  generateStoragePath: (config: GenerateStoragePathConfig) => string,
) {
  const localFilePath = source.path ?? source.url;

  const fileId = nanoid();
  const isVideo = source.mime.includes('video');
  const extension = isVideo ? 'mp4' : 'jpg';
  const filename = `${fileId}.${extension}`;
  const storagePath = generateStoragePath({ filename, isVideo });

  const reference = storage().ref(storagePath);
  const uploadTask = reference.putFile(localFilePath);

  return [filename, uploadTask, reference] as const;
}
