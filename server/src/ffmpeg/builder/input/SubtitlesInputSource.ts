import { SubtitlesStream } from '@/ffmpeg/builder/MediaStream.ts';
import {
  InputSource,
  InputSourceContinuity,
  StreamSource,
} from './InputSource.ts';

export class SubtitlesInputSource<
  StreamType extends SubtitlesStream = SubtitlesStream,
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
