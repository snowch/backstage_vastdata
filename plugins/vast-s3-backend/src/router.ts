import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import fetch from 'node-fetch';
import https from 'https'; // Import the https module

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;
  const router = Router();
  router.use(express.json());

  // Get VAST connection details from app-config.yaml
  const vastHost = config.getString('vast.host');
  const vastUsername = config.getString('vast.username');
  const vastPassword = config.getString('vast.password');

  // This is for development purposes only, to bypass self-signed certificate errors.
  // DO NOT USE IN PRODUCTION.
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  // This endpoint will be called by our frontend plugin
  router.get('/token', async (_, response) => {
    logger.info('Requesting new VAST API token');

    try {
      // Authenticate with the VAST API
      const authResponse = await fetch(`https://${vastHost}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: vastUsername,
          password: vastPassword,
        }),
        agent: httpsAgent, // Use the custom agent to allow self-signed certs
      });

      if (!authResponse.ok) {
        const errorBody = await authResponse.text();
        logger.error(`Failed to get VAST token: ${authResponse.status} ${errorBody}`);
        throw new Error('Failed to authenticate with VAST API');
      }

      const { access } = (await authResponse.json()) as { access: string };
      response.json({ token: access });
    } catch (error) {
      logger.error('Error fetching VAST token', error);
      response.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.use(errorHandler());
  return router;
}