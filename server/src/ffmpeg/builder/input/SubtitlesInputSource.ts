import { SubtitlesStream } from '@/ffmpeg/builder/MediaStream.ts';
import { SubtitlesState } from '../state/SubtitlesState.ts';
import {
  InputSource,
  InputSourceContinuity,
  StreamSource,
} from './InputSource.ts';

export class SubtitlesInputSource<
  StreamType extends SubtitlesStream = SubtitlesStream,
> extends InputSource<StreamType> {
  readonly type = 'subtitles';

  constructor(
    source: StreamSource,
    public streams: StreamType[],
    public desiredState: SubtitlesState,
    continuity: InputSourceContinuity = 'discrete',
  ) {
    super(source, continuity);
  }
}
