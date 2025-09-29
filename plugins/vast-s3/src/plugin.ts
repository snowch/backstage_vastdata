import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
} from '@backstage/core-plugin-api';
import { VastS3Page as VastS3PageComponent } from './components/VastS3Page/VastS3Page';
import { vastS3ApiRef, VastS3ApiClient } from './api';
import { rootRouteRef } from './routes';

export const vastS3Plugin = createPlugin({
  id: 'vast-s3',
  // apps can import `vasts3Plugin.provide` or use the exported api factory below
});

export const VastS3Page = VastS3PageComponent;

export const VastS3Routable = createRoutableExtension({
  component: () => import('./components/VastS3Page/VastS3Page').then(m => m.VastS3Page),
  mountPoint: rootRouteRef,
});

// Export an API factory so the app can provide the client implementation easily
export const apis = [
  createApiFactory({
    api: vastS3ApiRef,
    deps: {},
    factory: () => new VastS3ApiClient({
      // The actual discoveryApi/fetchApi will be wired by the app when registering
      // If the app wants to provide these, they should register their own factory.
      // This minimal factory will throw if used without wiring, but exporting it makes
      // the plugin shape explicit.
    } as any),
  }),
];