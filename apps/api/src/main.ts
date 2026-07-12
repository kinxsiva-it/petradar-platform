import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor.js';
import { Env } from './config/env.schema.js';
import {
  helmetOptions,
  jsonBodyLimit,
  shouldEnableApiDocs,
  urlEncodedBodyLimit,
} from './config/http-security.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  const config = app.get(ConfigService<Env, true>);
  const securityEnv = {
    API_DOCS_ENABLED: config.get('API_DOCS_ENABLED', { infer: true }),
    NODE_ENV: config.get('NODE_ENV', { infer: true }),
  };
  const trustProxyHops = config.get('TRUST_PROXY_HOPS', { infer: true });

  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }
  app.use(helmet(helmetOptions(securityEnv)));
  app.use(json({ limit: jsonBodyLimit }));
  app.use(urlencoded({ extended: true, limit: urlEncodedBodyLimit, parameterLimit: 100 }));
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

  if (shouldEnableApiDocs(securityEnv)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PetRadar API')
      .setDescription(
        'Community animal sighting, lost-pet matching, and rescue case management API.',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
