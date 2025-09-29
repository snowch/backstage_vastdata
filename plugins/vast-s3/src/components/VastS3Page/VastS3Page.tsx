import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { vastS3ApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import { Progress, Table, TableColumn } from '@backstage/core-components';

export const VastS3Page = () => {
  const vastS3Api = useApi(vastS3ApiRef);

  const { value, loading, error } = useAsync(async () => {
    return vastS3Api.getS3Buckets();
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <div>Error: {error.message}</div>;
  }

  const columns: TableColumn[] = [
    { title: 'Bucket', field: 'bucket' },
    { title: 'Policy', field: 'policy' },
    { title: 'S3 Versioning', field: 's3_versioning' },
  ];

  return (
    <Page themeId="tool">
      <Header title="VAST S3 Buckets" subtitle="Manage your S3 buckets on VAST Data">
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <ContentHeader title="S3 Buckets">
          <SupportButton>All your S3 buckets in one place.</SupportButton>
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <Table
              title="S3 Buckets on VAST"
              options={{ search: false, paging: false }}
              columns={columns}
              data={value || []}
            />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};