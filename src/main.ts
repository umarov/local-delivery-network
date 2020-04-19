import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import { determineMimeType } from './content-type';
import { ClientDetails, ClientDetailsJSON } from './client-types';
import {
  serializeClientDetails,
  createNewClientDetails,
  updateClientFileManifest
} from './client';

const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify.default({ logger: true });

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

server.post('/register', async (request, reply) => {
  reply.type('application/json').code(200);

  const { name, path, files } = request.body.client;

  server.log.info(`${name} is being registered with ${path} path:`);
  server.log.info(files);

  const client = clients.get(name) || createNewClientDetails(name, path);

  updateClientFileManifest(client, files);

  clients.set(name, client);

  return serializeClientDetails(client);
});

server.get('/:client', async (request, reply) => {
  const { client } = request.params;

  const existingClient = clients.get(client);

  if (existingClient) {
    reply.type('application/json').code(200);

    return { [client]: existingClient };
  } else {
    reply.code(404);

    return {};
  }
});

server.get('/:client/*', async (request, reply) => {
  const { client } = request.params;

  const existingClient = clients.get(client);

  if (existingClient) {
    const fileSubPath = request.params['*'];
    const fileName = fileSubPath.split('/').pop();
    const file = existingClient.filePaths.get(fileName);

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
});

server.listen(+(process.env.PORT || 3000), (err, address) => {
  if (err) throw err;
  server.log.info(`server listening on ${address}`);
});

process.on('unhandledRejection', console.log);
