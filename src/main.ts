import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';

const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify.default({ logger: true });

type clientDetails = { path: string; files: string[] };

const clients = new Map<string, clientDetails>();

const serializeClients = (): { [x: string]: clientDetails }[] => {
  const clientsToReturn = [];

  for (const [key, value] of clients.entries()) {
    clientsToReturn.push({ [key]: value });
  }

  return clientsToReturn;
};

server.get('/', async (request, reply) => {
  reply.type('application/json').code(200);

  return { timestamp: new Date(), projects: serializeClients() };
});

server.post('/register', async (request, reply) => {
  reply.type('application/json').code(200);
  server.log.info(request.body);

  const { name, path, files } = request.body.client;
  clients.set(name, { path, files });

  return { timestamp: new Date(), projects: serializeClients() };
});

server.get('/:client', async (request, reply) => {
  const { client } = request.params;

  const existingClient = clients.get(client);

  if (existingClient) {
    reply.type('application/json').code(200);

    return { timestamp: new Date(), [client]: existingClient };
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
    const pathFromClient = existingClient.files.find(
      (file) => file === filePath
    );

    if (!pathFromClient) {
      reply.code(404);
      return {};
    }

    if (pathFromClient.endsWith('.js')) {
      reply.type('text/javascript').code(200);
    } else if (pathFromClient.endsWith('.css')) {
      reply.type('text/css').code(200);
    } else if (pathFromClient.endsWith('.json')) {
      reply.type('application/json').code(200);
    } else if (pathFromClient.endsWith('.html')) {
      reply.type('text/html').code(200);
    } else if (pathFromClient.endsWith('.css')) {
      reply.type('text/css').code(200);
    }

    const stream = fs.createReadStream(
      `${existingClient.path}/${pathFromClient}`,
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
