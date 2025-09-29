import { createDevApp } from '@backstage/dev-utils';
import { vastS3Plugin, VastS3Page } from '../src/plugin';

createDevApp()
  .registerPlugin(vastS3Plugin)
  .addPage({
    element: <VastS3Page />,
    title: 'Root Page',
    path: '/vast-s3',
  })
  .render();
