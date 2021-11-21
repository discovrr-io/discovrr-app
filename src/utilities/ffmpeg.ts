import RNFS from 'react-native-fs';
import { Image, Video } from 'react-native-image-crop-picker';
import { nanoid } from '@reduxjs/toolkit';

import {
  FFmpegKit,
  FFprobeKit,
  MediaInformationSession,
  ReturnCode,
} from 'ffmpeg-kit-react-native';

import { MediaSource } from 'src/api';

type MediaSourceOmitMime = Omit<MediaSource, 'mime'>;

export async function compressVideo(
  video: MediaSource,
  scaleWidth: number,
): Promise<MediaSource> {
  const filename = `${nanoid()}.mp4`;
  const outputDirectory = getCompressedVideoOutputDirectory();
  const output = `${outputDirectory}/${filename}`;

  if (!(await RNFS.exists(outputDirectory))) {
    console.log("Creating 'videos' folder...");
    await RNFS.mkdir(outputDirectory);
  }

  console.log(`Compressing video '${filename}'...`);
  const command = `-t 60 -i "${video.path}" -filter:v "scale=${scaleWidth}:trunc(ow/a/2)*2,crop=${scaleWidth}:min(in_h\\,${scaleWidth}/2*3)" -c:a copy "${output}"`;

  return await new Promise<MediaSource>((resolve, reject) => {
    console.log('Running FFmpeg command:', command);
    FFmpegKit.executeAsync(command, async session => {
      const returnCode = await session.getReturnCode();
      const duration = await session.getDuration();

      if (!ReturnCode.isSuccess(returnCode)) {
        if (ReturnCode.isCancel(returnCode)) {
          console.warn('FFmpeg task cancelled!');
        } else {
          console.error(
            'Failed to generate thumbnail with return code:',
            returnCode,
          );
        }

        reject(returnCode);
      }

      console.log(`Successfully compressed video in ${duration} ms.`);
      console.log('Getting media information....');

      const outputURI = `file://${output}`;
      const mediaInformation = await getMediaSourceForFile(outputURI);

      resolve({
        ...video,
        ...mediaInformation,
        duration: Math.min(video.duration ?? 0, 60 * 1000),
      });
    });
  });
}

export async function generateThumbnail(
  video: MediaSource,
): Promise<MediaSource> {
  const filename = `${nanoid()}.jpg`;
  const outputDirectory = getThumbnailOutputDirectory();
  const output = `${outputDirectory}/${filename}`;

  if (!(await RNFS.exists(outputDirectory))) {
    console.log("Creating 'thumbnails' folder...");
    await RNFS.mkdir(outputDirectory);
  }

  console.log(`Generating video thumbnail '${filename}'...`);
  const command = `-i ${video.path} -vframes 1 -vf "scale=320:-1" "${output}"`;

  // TODO: Refactor this out
  // NOTE: This does not implement a `duration` field
  return await new Promise<MediaSource>((resolve, reject) => {
    console.log('Running FFmpeg command:', command);
    FFmpegKit.executeAsync(command, async session => {
      const returnCode = await session.getReturnCode();
      const duration = await session.getDuration();

      if (!ReturnCode.isSuccess(returnCode)) {
        if (ReturnCode.isCancel(returnCode)) {
          console.warn('FFmpeg task cancelled!');
        } else {
          console.error(
            'Failed to generate thumbnail with return code:',
            returnCode,
          );
        }

        reject(returnCode);
      }

      console.log(`Successfully generated thumbnail in ${duration} ms.`);
      console.log('Getting media information....');

      const outputURI = `file://${output}`;
      const mediaInformation = await getMediaSourceForFile(outputURI);

      resolve({
        mime: 'image/jpeg',
        ...mediaInformation,
      });
    });
  });
}

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
    // path: /* video.sourceURL ?? */ video.path.replace('file://', ''),
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
