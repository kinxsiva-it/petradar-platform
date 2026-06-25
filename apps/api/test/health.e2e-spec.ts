import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';
import request from 'supertest';

import { HealthModule } from '../src/health/health.module.js';

describe('Health endpoint', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ok', async () => {
    const httpServer = app.getHttpServer() as unknown as Parameters<typeof request>[0];

    await request(httpServer)
      .get('/api/v1/health')
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          service: 'petradar-api',
          status: 'ok',
        });
      });
  });
});
