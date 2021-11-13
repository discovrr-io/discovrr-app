import RNFS from 'react-native-fs';
import { Image, Video } from 'react-native-image-crop-picker';

import {
  FFprobeKit,
  MediaInformationSession,
  ReturnCode,
} from 'ffmpeg-kit-react-native';

import { MediaSource } from 'src/api';

type MediaSourceOmitMime = Omit<MediaSource, 'mime'>;

export async function getMediaSourceForFile(
  fileURI: string,
): Promise<MediaSourceOmitMime> {
  return await new Promise<MediaSourceOmitMime>((resolve, reject) => {
    FFprobeKit.getMediaInformationAsync(fileURI, async session => {
      const mediaSession = session as MediaInformationSession;
      const returnCode = await mediaSession.getReturnCode();
      const information = mediaSession.getMediaInformation();
      const streams: any[] = information.getAllProperties()['streams'];

      if (!ReturnCode.isSuccess(returnCode)) {
        if (ReturnCode.isCancel(returnCode)) {
          console.warn('FFmpeg task cancelled!');
        } else {
          console.error(
            `Failed to generate get media information with return code:`,
            returnCode,
          );
        }

        reject(returnCode);
      }

      resolve({
        url: fileURI,
        filename: fileURI.slice(fileURI.lastIndexOf('/') + 1),
        path: fileURI.replace('file://', ''),
        width: streams[0]?.['width'],
        height: streams[0]?.['height'],
        size: Number.parseInt(information.getSize()),
      });
    });
  });
}

export function mapImageToMediaSource(image: Image): MediaSource {
  return {
    mime: image.mime,
    url: image.path, // Already has `file://` prefix
    path: image.path.replace('file://', ''),
    filename: image.filename,
    size: image.size,
    width: image.width,
    height: image.height,
  };
}

export function mapVideoToMediaSource(video: Video): MediaSource {
  return {
    ...mapImageToMediaSource(video),
    // TODO: Prefer higher quality source with sourceURL (only available on iOS)
    path: /* video.sourceURL ?? */ video.path.replace('file://', ''),
    duration: video.duration,
  };
}

export function getOutputDirectory(): string {
  return RNFS.TemporaryDirectoryPath.endsWith('/')
    ? RNFS.TemporaryDirectoryPath.slice(0, -1)
    : RNFS.TemporaryDirectoryPath;
}

export function getCompressedVideoOutputDirectory(): string {
  return `${getOutputDirectory()}/videos`;
}

export function getThumbnailOutputDirectory(): string {
  return `${getOutputDirectory()}/thumbnails`;
}
