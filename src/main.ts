import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';

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

server.listen(3000, (err, address) => {
  if (err) throw err;
  server.log.info(`server listening on ${address}`);
});

process.on('unhandledRejection', console.log);
