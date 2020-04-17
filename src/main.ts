import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import { determineMimeType } from './content-type';
import { ClientDetails } from './client-types';

const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify.default({ logger: true });

const clients = new Map<string, ClientDetails>();

const serializeClients = (): { [x: string]: ClientDetails }[] => {
  const clientsToReturn = [];

  for (const [key, value] of clients.entries()) {
    clientsToReturn.push({ [key]: value });
  }

  return clientsToReturn;
};

server.get('/', async (_, reply) => {
  reply.type('application/json').code(200);

  return { projects: serializeClients() };
});

server.post('/register', async (request, reply) => {
  reply.type('application/json').code(200);
  server.log.info(request.body);

  const { name, path, files } = request.body.client;
  clients.set(name, { path, files });

  return { projects: serializeClients() };
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
    const filePath = request.params['*'];
    const file = existingClient.files.find(
      ({ name }) => name === filePath || name.endsWith(filePath)
    );

    if (!file) {
      reply.code(404);
      return {};
    }

    const { name } = file;

    const mimeType = determineMimeType(name);

    if (mimeType) {
      reply.type(mimeType);
    }

    reply.code(200);

    const stream = fs.createReadStream(
      `${existingClient.path}/${name}`,
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
