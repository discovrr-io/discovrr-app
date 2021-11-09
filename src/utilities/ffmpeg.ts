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
        width: streams[0]?.['width'],
        height: streams[0]?.['height'],
        size: Number.parseInt(information.getSize()),
      });
    });
  });
}
