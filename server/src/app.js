import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { createApiRouter } from './routes/api.js';
import { errorHandler, notFoundHandler } from './utils/http.js';
import { openApiSpec } from './openapi.js';

export function createApp(env) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/api/docs.json', (_req, res) => res.json(openApiSpec));
  app.use('/api', createApiRouter(env));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
