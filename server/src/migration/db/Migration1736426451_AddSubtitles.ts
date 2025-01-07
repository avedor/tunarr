import { Kysely, Migration } from 'kysely';

/**
 * This migration adds the `subtitlesFormat` column to the `transcode_config` table.
 */
export default {
  async up(db: Kysely<unknown>) {
    await db.schema
      .alterTable('transcode_config')
      .addColumn('subtitles_format', 'text')
      .execute();
  },
} satisfies Migration;
