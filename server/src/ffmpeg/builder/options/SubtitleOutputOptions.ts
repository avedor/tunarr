import { makeConstantOutputOption } from './OutputOption.ts';

export const SubtitleFormatOutputOption = (subtitleFormat: string) =>
  makeConstantOutputOption([`${subtitleFormat}`]);
