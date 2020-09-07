import { FastifyInstance } from 'fastify';
import fs from 'fs';
import { determineMimeType } from './content-type';
import path from 'path';
import {
  getDirectoryDetails,
  subDirFolder,
  getAppPath
} from './getDirectoryDetails';

const baseDir = process.env.BASE_DIR || '';
const aggregatedMode = !!process.env.AGGREGATED;

export function setupAllAppsRoute(server: FastifyInstance): void {
  server.get('/', async (_, reply) => {
    reply.type('application/json').code(200);

    const apps: subDirFolder = {};

    if (baseDir) {
      const dir = await fs.promises.opendir(
        aggregatedMode ? path.join(baseDir, 'dist') : baseDir
      );

      for await (const dirent of dir) {
        const subdirPath = getAppPath(dirent.name, baseDir, aggregatedMode);

        if (dirent.name !== 'dist') {
          apps[dirent.name] = [];

          try {
            const subdir = await fs.promises.opendir(subdirPath);

            apps[dirent.name].push(
              ...(await getDirectoryDetails(subdirPath, subdir))
            );
          } catch (err) {
            server.log.info(`${subdirPath} does not exist`)
          }
        }
      }
    }

    return {
      baseDir,
      aggregatedMode,
      apps
    };
  });
}

export function setupAppRoute(server: FastifyInstance): void {
  server.get<{ Params: { app: string } }>('/:app', async (request, reply) => {
    const { app } = request.params;

    try {
      const appPath = getAppPath(app, baseDir, aggregatedMode);
      const dir = await fs.promises.opendir(appPath);
      const files = await getDirectoryDetails(appPath, dir);

      reply.type('application/json').code(200);

      return { [app]: files };
    } catch (err) {
      reply.code(404);

      return {};
    }
  });
}

export function setupServeAppFilesRoute(server: FastifyInstance): void {
  server.get<{ Params: { app: string; ['*']: string } }>(
    '/:app/*',
    async (request, reply) => {
      const { app } = request.params;

      try {
        const path = getAppPath(app, baseDir, aggregatedMode);
        const fileSubPath = request.params['*'];
        const file = `${path}/${fileSubPath}`;

        const mimeType = determineMimeType(file);

        if (mimeType) {
          server.log.info(mimeType);
          reply.type(mimeType);
        }

        reply.code(200);

        const stream = fs.createReadStream(file, 'utf8');

        reply.send(stream);
      } catch (err) {
        reply.code(404);
        return {};
      }
    }
  );
}
