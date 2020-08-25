import fastify, { FastifyInstance } from 'fastify';
import fs from 'fs';
import { determineMimeType } from './content-type';
import { ClientDetails, ClientDetailsJSON, ClientFile } from './client-types';
import {
  serializeClientDetails,
  createNewClientDetails,
  updateClientFileManifest
} from './client';

const server: FastifyInstance = fastify({ logger: true });

const baseDir = process.env.BASE_DIR;

const monoRepoMode = !!baseDir;
const aggregatedMode = !!process.env.AGGREGATED;

const clients = new Map<string, ClientDetails>();

const serializeClients = (): { [x: string]: ClientDetailsJSON }[] => {
  const clientsToReturn = [];

  for (const [key, value] of clients.entries()) {
    clientsToReturn.push({ [key]: serializeClientDetails(value) });
  }

  return clientsToReturn;
};

server.get('/', async (_, reply) => {
  reply.type('application/json').code(200);

  return { projects: serializeClients() };
});

server.post<{
  Body: { client: { name: string; path: string; files: ClientFile[] } };
}>('/register', async (request, reply) => {
  reply.type('application/json').code(200);

  const { name, path, files } = request.body.client;

  server.log.info(`${name} is being registered with ${path} path:`);
  server.log.info(files);

  const client = clients.get(name) || createNewClientDetails(name, path);

  updateClientFileManifest(client, files);

  clients.set(name, client);

  return serializeClientDetails(client);
});

server.get<{ Params: { client: string } }>(
  '/:client',
  async (request, reply) => {
    const { client } = request.params;

    if (monoRepoMode) {
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
    } else {
      const existingClient = clients.get(client);

      if (existingClient) {
        reply.type('application/json').code(200);

        return { [client]: existingClient };
      } else {
        reply.code(404);

        return {};
      }
    }
  }
);

server.get<{ Params: { client: string; ['*']: string } }>(
  '/:client/*',
  async (request, reply) => {
    const { client } = request.params;

    if (monoRepoMode) {
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
    } else {
      const existingClient = clients.get(client);

      if (existingClient) {
        const fileSubPath = request.params['*'];
        const fileName = fileSubPath.split('/').pop();
        const file = fileName && existingClient.filePaths.get(fileName);

        if (!file) {
          reply.code(404);
          return {};
        }

        const mimeType = determineMimeType(file);

        if (mimeType) {
          server.log.info(mimeType);
          reply.type(mimeType);
        }

        reply.code(200);

        const stream = fs.createReadStream(
          `${existingClient.path}/${fileSubPath}`,
          'utf8'
        );

        reply.send(stream);
      } else {
        reply.code(404);

        return {};
      }
    }
  }
);

server.listen(+(process.env.PORT || 3000), (err, address) => {
  if (err) throw err;
  server.log.info(`server listening on ${address}`);
});

process.on('unhandledRejection', console.log);
