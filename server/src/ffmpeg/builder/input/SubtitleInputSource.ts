import { SubtitleStream } from '@/ffmpeg/builder/MediaStream.ts';
import {
  InputSource,
  InputSourceContinuity,
  StreamSource,
} from './InputSource.ts';

export class SubtitleInputSource<
  StreamType extends SubtitleStream = SubtitleStream,
> extends InputSource<StreamType> {
  readonly type = 'subtitle';

  constructor(
    source: StreamSource,
    public streams: StreamType[],
    continuity: InputSourceContinuity = 'discrete',
  ) {
    super(source, continuity);
  }
}
