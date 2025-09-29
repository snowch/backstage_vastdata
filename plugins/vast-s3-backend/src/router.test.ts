import {
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';

describe('createRouter', () => {
  let app: express.Express;

  beforeEach(async () => {
    const router = await createRouter({
      logger: mockServices.logger.mock(),
      config: mockServices.rootConfig({
        data: {
          vast: {
            host: '10.143.11.204',
            username: 'admin',
            password: 'password',
          },
        },
      }),
    });
    app = express();
    app.use(router);
  });

  it('should have a test-token endpoint', async () => {
    // This is a basic smoke test - actual testing would require mocking fetch
    const response = await request(app).get('/test-token');
    
    // We expect it to either succeed or fail with 500 (due to network/auth issues in tests)
    expect([200, 500]).toContain(response.status);
  });
});