import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor.js';
import { Env } from './config/env.schema.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<Env, true>);

  app.use(cookieParser());
  app.enableCors({
    credentials: true,
    origin: config.get('WEB_ORIGIN', { infer: true }),
  });
  app.setGlobalPrefix(config.get('API_PREFIX', { infer: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PetRadar API')
    .setDescription('Community animal sighting, lost-pet matching, and rescue case management API.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
