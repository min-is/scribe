'use server';

import { runAuthenticatedAdminServerAction } from '@/auth/server';
import { testRedisConnection } from '@/platforms/redis';
import { testOpenAiConnection } from '@/platforms/openai';
import { testDatabaseConnection } from '@/platforms/postgres';
import { testStorageConnection } from '@/platforms/storage';
import { APP_CONFIGURATION } from '@/app/config';

export type AdminData = Awaited<ReturnType<typeof getAdminDataAction>>;

export const getAdminDataAction = async () =>
  runAuthenticatedAdminServerAction(async () => {
    // Minimal admin data - photography features removed
    return {
      photosCount: 0,
      photosCountHidden: 0,
      photosCountNeedSync: 0,
      photosCountTotal: 0,
      uploadsCount: 0,
      tagsCount: 0,
      recipesCount: 0,
      insightsIndicatorStatus: undefined,
    } as const;
  });

const scanForError = (
  shouldCheck: boolean,
  promise: () => Promise<any>,
): Promise<string> =>
  shouldCheck
    ? promise()
      .then(() => '')
      .catch(error => error.message)
    : Promise.resolve('');

export const testConnectionsAction = async () =>
  runAuthenticatedAdminServerAction(async () => {
    const {
      hasDatabase,
      hasStorageProvider,
      hasRedisStorage,
      isAiTextGenerationEnabled,
    } = APP_CONFIGURATION;

    const [
      databaseError,
      redisError,
      storageError,
      openAiError,
    ] = await Promise.all([
      scanForError(hasDatabase, testDatabaseConnection),
      scanForError(hasRedisStorage, testRedisConnection),
      scanForError(hasStorageProvider, testStorageConnection),
      scanForError(isAiTextGenerationEnabled, testOpenAiConnection),
    ]);

    return {
      databaseError,
      redisError,
      storageError,
      openAiError,
    } as const;
  });
