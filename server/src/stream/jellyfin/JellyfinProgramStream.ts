import { basename, dirname, join } from 'path';
import { readdirSync } from 'fs';
import { ChannelDB } from '@/db/ChannelDB.ts';
import { SettingsDB, getSettings } from '@/db/SettingsDB.ts';
import { isContentBackedLineupIteam } from '@/db/derived_types/StreamLineup.ts';
import { MediaSourceDB } from '@/db/mediaSourceDB.ts';
import { MediaSourceType } from '@/db/schema/MediaSource.ts';
import { FFmpegFactory } from '@/ffmpeg/FFmpegFactory.ts';
import { FfmpegTranscodeSession } from '@/ffmpeg/FfmpegTrancodeSession.js';
import { OutputFormat } from '@/ffmpeg/builder/constants.ts';
import { IFFMPEG } from '@/ffmpeg/ffmpegBase.ts';
import { PlayerContext } from '@/stream/PlayerStreamContext.js';
import { ProgramStream } from '@/stream/ProgramStream.js';
import { UpdateJellyfinPlayStatusScheduledTask } from '@/tasks/jellyfin/UpdateJellyfinPlayStatusTask.js';
import { Result } from '@/types/result.js';
import { Maybe, Nullable } from '@/types/util.js';
import { ifDefined } from '@/util/index.js';
import { LoggerFactory } from '@/util/logging/LoggerFactory.js';
import dayjs from 'dayjs';
import { isNil, isNull, isUndefined } from 'lodash-es';
import { JellyfinStreamDetails } from './JellyfinStreamDetails.js';
import { MediaSourceApiFactory } from '@/external/MediaSourceApiFactory.ts';

export class JellyfinProgramStream extends ProgramStream {
  protected logger = LoggerFactory.child({
    caller: import.meta,
    className: JellyfinProgramStream.name,
  });
  private ffmpeg: Nullable<IFFMPEG> = null;
  private killed: boolean = false;
  private updatePlayStatusTask: Maybe<UpdateJellyfinPlayStatusScheduledTask>;

  constructor(
    context: PlayerContext,
    outputFormat: OutputFormat,
    settingsDB: SettingsDB = getSettings(),
    private mediaSourceDB: MediaSourceDB = new MediaSourceDB(new ChannelDB()),
  ) {
    super(context, outputFormat, settingsDB);
  }

  protected shutdownInternal() {
    this.killed = true;
    ifDefined(this.updatePlayStatusTask, (task) => {
      task.stop();
    });
  }

  async setupInternal(): Promise<Result<FfmpegTranscodeSession>> {
    const lineupItem = this.context.lineupItem;
    if (!isContentBackedLineupIteam(lineupItem)) {
      return Result.failure(
        new Error(
          'Lineup item is not backed by a media source: ' +
            JSON.stringify(lineupItem),
        ),
      );
    }

    const server = await this.mediaSourceDB.findByType(
      MediaSourceType.Jellyfin,
      lineupItem.externalSourceId,
    );

    if (isNil(server)) {
      return Result.failure(
        new Error(
          `Unable to find server "${lineupItem.externalSourceId}" specified by program.`,
        ),
      );
    }

    // const plexSettings = this.context.settings.plexSettings();
    const jellyfinStreamDetails = new JellyfinStreamDetails(
      server,
      this.settingsDB,
    );

    const watermark = await this.getWatermark();
    this.ffmpeg = FFmpegFactory.getFFmpegPipelineBuilder(
      this.settingsDB.ffmpegSettings(),
      this.context.transcodeConfig,
      this.context.sourceChannel,
      this.context.streamMode,
    );

    const stream = await jellyfinStreamDetails.getStream(lineupItem);
    if (isNull(stream)) {
      return Result.failure(
        new Error('Unable to retrieve stream details from Jellyfin'),
      );
    }

    if (this.killed) {
      return Result.failure(new Error('Stream was killed already, returning'));
    }

    const streamStats = stream.streamDetails;
    if (streamStats) {
      streamStats.duration = lineupItem.streamDuration
        ? dayjs.duration(lineupItem.streamDuration)
        : undefined;
    }

    const sourcePath = stream.streamDetails.directFilePath;
    let baseNameExt = basename(sourcePath)
    let subtitlesPath: Nullable<string> = null;
    
    if (sourcePath) {
      const sourceDir = dirname(sourcePath);
      console.log(`Source Directory: ${sourceDir}`);
    
      try { 
        const baseName = baseNameExt.replace(/\.[^/.]+$/, ''); // Strip the extension
        console.log(`Base Name: ${baseName}`);
    
        // List all files in the directory
        const jellyfinClient = await MediaSourceApiFactory().getJellyfinByName("JF");
        const adjacentItems = await jellyfinClient.getDirectoryContents(sourceDir);

        console.log(adjacentItems);
    
        // Filter for subtitles: match file names (without extensions) and look for .srt files
        const potentialSubtitles = adjacentItems.filter((fileName) =>
          fileName.startsWith(baseName) && fileName.endsWith('.srt')
        );

        console.log("Potential Subtitles:", potentialSubtitles);
    
        // Use the first match, if available
        if (potentialSubtitles.length > 0) {
          subtitlesPath = join(sourceDir, potentialSubtitles[0]); // Combine directory with file name
        }
      } catch (err) {
        console.error(`Failed to read directory: ${sourceDir}`, err);
      }
    }
    
    console.log(`Subtitles Path: ${subtitlesPath}`);
    

    const start = dayjs.duration(lineupItem.startOffset ?? 0);

    const ffmpegOutStream = await this.ffmpeg.createStreamSession({
      streamSource: stream.streamSource,
      streamDetails: stream.streamDetails,
      startTime: start,
      duration:
        +start === 0
          ? dayjs.duration(lineupItem.duration)
          : dayjs.duration(lineupItem.streamDuration ?? lineupItem.duration),
      watermark,
      subtitles: null,
      realtime: this.context.realtime,
      extraInputHeaders: {},
      outputFormat: this.outputFormat,
      streamMode: this.context.streamMode,
    });

    if (isUndefined(ffmpegOutStream)) {
      return Result.failure(new Error('Unable to spawn ffmpeg'));
    }

    return Result.success(ffmpegOutStream);
  }
}
