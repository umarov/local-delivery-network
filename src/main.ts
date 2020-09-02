import fastify, { FastifyInstance } from 'fastify';
import {
  setupAllAppsRoute,
  setupAppRoute,
  setupServeAppFilesRoute
} from './appRoutes';

const server: FastifyInstance = fastify({ logger: true });

if (!process.env.BASE_DIR) {
  console.log(
    'You must set the BASE_DIR environment variable for this server to serve files from',
    '\n'
  );
  process.exit(1);
}

setupAllAppsRoute(server);
setupAppRoute(server);
setupServeAppFilesRoute(server);

server.listen(
  +(process.env.PORT || 3000),
  process.env.HOST || '0.0.0.0',
  (err, address) => {
    if (err) throw err;
    server.log.info(`server listening on ${address}`);
  }
);

process.on('unhandledRejection', console.log);
