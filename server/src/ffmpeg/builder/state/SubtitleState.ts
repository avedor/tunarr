import { ExcludeByValueType, Nullable } from '@/types/util.ts';
import { isNil, omitBy } from 'lodash-es';
import { AnyFunction } from 'ts-essentials';

export type SubtitleStateFields = ExcludeByValueType<
  SubtitleState,
  AnyFunction
>;

const DefaultSubtitleState: SubtitleState = {
  subtitleEncoder: 'srt',
  subtitleLanguage: 'und', // 'und' for undefined
  subtitleCodec: null,
  subtitleFormat: null,
  subtitleDelay: null,
  subtitleDuration: null,
  subtitleDefault: false,
  subtitleForced: false,
};

export class SubtitleState {
  subtitleEncoder: string;
  subtitleLanguage: string; // Language code, e.g., 'en', 'es', 'fr'
  subtitleCodec: Nullable<string>;
  subtitleFormat: Nullable<string>; // Format like SRT, ASS, etc.
  subtitleDelay: Nullable<number>; // Delay in milliseconds
  subtitleDuration: Nullable<number>; // Duration in milliseconds
  subtitleDefault: boolean; // Whether it's the default subtitle
  subtitleForced: boolean; // Whether it's a forced subtitle

  private constructor(fields: Partial<SubtitleStateFields> = {}) {
    const merged: SubtitleStateFields = {
      ...DefaultSubtitleState,
      ...omitBy(fields, isNil),
    };
    this.subtitleEncoder = merged.subtitleEncoder;
    this.subtitleLanguage = merged.subtitleLanguage;
    this.subtitleCodec = merged.subtitleCodec;
    this.subtitleFormat = merged.subtitleFormat;
    this.subtitleDelay = merged.subtitleDelay;
    this.subtitleDuration = merged.subtitleDuration;
    this.subtitleDefault = merged.subtitleDefault;
    this.subtitleForced = merged.subtitleForced;
  }

  static create(fields: Partial<SubtitleStateFields> = {}) {
    return new SubtitleState(fields);
  }
}
