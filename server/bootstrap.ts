import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { migrateAndSeed } from './database/migrate';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  await migrateAndSeed();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: process.env.NODE_ENV !== 'development',
    logger: ['error', 'warn', 'log'],
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, forbidUnknownValues: false }));

  const host = process.env.SERVER_HOST || '0.0.0.0';
  const port = Number(process.env.SERVER_PORT || '3000');

  await app.listen(port, host);
  logger.log(`Server running on http://${host}:${port}`);
  logger.log(`API endpoints ready at http://${host}:${port}/api`);
  logger.log(`Default admin: admin / admin123`);
}

bootstrap();
