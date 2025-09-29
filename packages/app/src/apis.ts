import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  // Import the missing APIs
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

// Import your new VAST S3 API client
import { vastS3ApiRef, VastS3ApiClient } from '@internal/plugin-vast-s3';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),

  // Add the factory for your new API client
  createApiFactory({
    api: vastS3ApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      fetchApi: fetchApiRef,
    },
    factory: ({ discoveryApi, fetchApi }) =>
      new VastS3ApiClient({ discoveryApi, fetchApi }),
  }),
];
