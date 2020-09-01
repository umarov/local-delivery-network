import fastify, { FastifyInstance } from 'fastify';
import fs from 'fs';
import { determineMimeType } from './content-type';
import path from 'path';

const server: FastifyInstance = fastify({ logger: true });

const baseDir = process.env.BASE_DIR;

const enabled = !!baseDir;
const aggregatedMode = !!process.env.AGGREGATED;

if (!enabled) {
  console.log(
    'You must set the BASE_DIR environment variable for this server to serve files from',
    '\n'
  );
  process.exit(1);
}
type subDirFolder = { [key: string]: subDir };
type subDir = (string | subDirFolder)[];

async function getDirectoryDetails(
  currentPath: string,
  dir: fs.Dir
): Promise<subDir> {
  const subDirs: subDir = [];
  for await (const dirent of dir) {
    if (dirent.isDirectory()) {
      const subdirPath = path.join(currentPath, dirent.name);
      const subdir = await fs.promises.opendir(subdirPath);
      subDirs.push({
        [dirent.name]: await getDirectoryDetails(subdirPath, subdir)
      });
    } else {
      subDirs.push(dirent.name);
    }
  }

  return subDirs;
}

server.get('/', async (_, reply) => {
  reply.type('application/json').code(200);

  const apps: subDirFolder = {};

  if (baseDir) {
    const dir = await fs.promises.opendir(
      aggregatedMode ? path.join(baseDir, 'dist') : baseDir
    );
    for await (const dirent of dir) {
      const subdirPath = aggregatedMode
        ? path.join(baseDir, 'dist', dirent.name)
        : path.join(baseDir, dirent.name, 'dist');

      if (dirent.name !== 'dist') {
        apps[dirent.name] = [];
        const subdir = await fs.promises.opendir(subdirPath);

        apps[dirent.name].push(
          ...(await getDirectoryDetails(subdirPath, subdir))
        );
      }
    }
  }

  return {
    baseDir,
    aggregatedMode,
    apps
  };
});

server.get<{ Params: { client: string } }>(
  '/:client',
  async (request, reply) => {
    const { client } = request.params;

    try {
      const path = aggregatedMode
        ? `${baseDir}/dist/${client}`
        : `${baseDir}/${client}/dist`;
      const dir = await fs.promises.opendir(path);
      const files = [];
      for await (const dirent of dir) {
        files.push(dirent.name);
      }

      reply.type('application/json').code(200);

      return { [client]: files };
    } catch (err) {
      reply.code(404);

      return {};
    }
  }
);

server.get<{ Params: { client: string; ['*']: string } }>(
  '/:client/*',
  async (request, reply) => {
    const { client } = request.params;

    try {
      const path = aggregatedMode
        ? `${baseDir}/dist/${client}`
        : `${baseDir}/${client}/dist`;
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

server.listen(
  +(process.env.PORT || 3000),
  process.env.HOST || '0.0.0.0',
  (err, address) => {
    if (err) throw err;
    server.log.info(`server listening on ${address}`);
  }
);

process.on('unhandledRejection', console.log);
