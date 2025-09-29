import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import fetch from 'node-fetch';
import https from 'https';

export interface RouterOptions {
  logger: LoggerService;
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

  // Helper function to get a fresh token
  async function getVastToken(): Promise<string> {
    logger.info('Requesting new VAST API token');
    
    const authResponse = await fetch(`https://${vastHost}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: vastUsername,
        password: vastPassword,
      }),
      agent: httpsAgent,
    });

    if (!authResponse.ok) {
      const errorBody = await authResponse.text();
      logger.error(`Failed to get VAST token: ${authResponse.status} ${errorBody}`);
      throw new Error('Failed to authenticate with VAST API');
    }

    const { access } = (await authResponse.json()) as { access: string };
    logger.info('Successfully obtained VAST token', { 
      tokenLength: access?.length,
      tokenPrefix: access?.substring(0, 20) + '...'
    });
    
    return access;
  }

  // Get S3 buckets directly from backend
  router.get('/buckets', async (_req, res) => {
    logger.info('Fetching S3 buckets from VAST');
    
    try {
      const token = await getVastToken();
      
  const bucketsUrl = `https://${vastHost}/api/latest/views/?bucket__regex=^.%2B$&fields=bucket,policy,s3_versioning`;
  logger.info(`Requesting buckets from: ${bucketsUrl}`);
      
      const bucketsResponse = await fetch(bucketsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        agent: httpsAgent,
      });

      if (!bucketsResponse.ok) {
        const errorBody = await bucketsResponse.text();
        logger.error(`Failed to fetch buckets: ${bucketsResponse.status} ${errorBody}`);
        return res.status(bucketsResponse.status).json({
          error: `Failed to fetch buckets: ${bucketsResponse.statusText}`,
          details: errorBody
        });
      }

      const buckets = await bucketsResponse.json();
      logger.info('Successfully fetched buckets', { count: buckets.length });
      return res.json(buckets);
      
    } catch (error: any) {
      logger.error('Error fetching S3 buckets', error);
      return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });

  // Token endpoint
  router.get('/token', async (_req, res) => {
    try {
      const token = await getVastToken();
      res.json({ token });
    } catch (error: any) {
      logger.error('Error fetching VAST token', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });

  // TEST ENDPOINT
  router.get('/test-token', async (_req, res) => {
    logger.info('Testing VAST API token flow');
    
    try {
      const token = await getVastToken();
      
  const testUrl = `https://${vastHost}/api/latest/views/?bucket__regex=^.%2B$&fields=bucket,policy,s3_versioning`;
  logger.info(`Testing token against: ${testUrl}`);
      
      const testResponse = await fetch(testUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        agent: httpsAgent,
      });

      const testBody = await testResponse.text();
      
      res.json({
        tokenRequest: {
          success: true,
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...'
        },
        apiRequest: {
          url: testUrl,
          success: testResponse.ok,
          status: testResponse.status,
          statusText: testResponse.statusText,
          responsePreview: testBody.substring(0, 500)
        },
        verdict: testResponse.ok ? 'SUCCESS: Token works!' : 'FAILED: Token is invalid or API requires different auth'
      });
    } catch (error: any) {
      logger.error('Error in test-token endpoint', error);
      res.status(500).json({ 
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });

  router.use(errorHandler());
  return router;
}