import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const vastS3Plugin = createPlugin({
  id: 'vast-s3',
  routes: {
    root: rootRouteRef,
  },
});

export const VastS3Page = vastS3Plugin.provide(
  createRoutableExtension({
    name: 'VastS3Page',
    component: () =>
      import('./components/VastS3Page/VastS3Page').then(m => m.VastS3Page),
    mountPoint: rootRouteRef,
  }),
);