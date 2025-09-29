import React from 'react';
import { Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
  Progress,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { vastS3ApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';

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
          <CreateBucketButton />
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

const CreateBucketButton = () => {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');

  return (
    <>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
        Create bucket
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create S3 Bucket (stub)</DialogTitle>
        <DialogContent>
          <div style={{ marginTop: 8 }}>
            <TextField
              label="Bucket name"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
            />
          </div>
          <p style={{ marginTop: 12 }}>
            This is a UI-only stub. Submitting will only show a confirmation and won't create a real bucket.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              // Simple stub behaviour: show an alert and close
              // In a real implementation this would call the backend
              // to create the bucket and then refresh the table.
              // eslint-disable-next-line no-alert
              alert(`Stub: would create bucket '${name || '<empty name>'}'`);
              setOpen(false);
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};