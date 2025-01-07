import { ExcludeByValueType, Nullable } from '@/types/util.ts';
import { isNil, omitBy } from 'lodash-es';
import { AnyFunction } from 'ts-essentials';

export type SubtitlesStateFields = ExcludeByValueType<
  SubtitlesState,
  AnyFunction
>;

const DefaultSubtitlesState: SubtitlesState = {
  subtitlesEncoder: 'srt',
  subtitlesLanguage: 'und', // 'und' for undefined
  subtitlesCodec: null,
  subtitlesFormat: null,
  subtitlesDelay: null,
  subtitlesDuration: null,
  subtitlesDefault: false,
  subtitlesForced: false,
};

export class SubtitlesState {
  subtitlesEncoder: string;
  subtitlesLanguage: string; // Language code, e.g., 'en', 'es', 'fr'
  subtitlesCodec: Nullable<string>;
  subtitlesFormat: Nullable<string>; // Format like SRT, ASS, etc.
  subtitlesDelay: Nullable<number>; // Delay in milliseconds
  subtitlesDuration: Nullable<number>; // Duration in milliseconds
  subtitlesDefault: boolean; // Whether it's the default subtitle
  subtitlesForced: boolean; // Whether it's a forced subtitle

  private constructor(fields: Partial<SubtitlesStateFields> = {}) {
    const merged: SubtitlesStateFields = {
      ...DefaultSubtitlesState,
      ...omitBy(fields, isNil),
    };
    this.subtitlesEncoder = merged.subtitlesEncoder;
    this.subtitlesLanguage = merged.subtitlesLanguage;
    this.subtitlesCodec = merged.subtitlesCodec;
    this.subtitlesFormat = merged.subtitlesFormat;
    this.subtitlesDelay = merged.subtitlesDelay;
    this.subtitlesDuration = merged.subtitlesDuration;
    this.subtitlesDefault = merged.subtitlesDefault;
    this.subtitlesForced = merged.subtitlesForced;
  }

  static create(fields: Partial<SubtitlesStateFields> = {}) {
    return new SubtitlesState(fields);
  }
}
