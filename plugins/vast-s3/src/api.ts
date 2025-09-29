import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

// Define the shape of a VAST S3 Bucket
export interface S3Bucket {
  s3_versioning: boolean;
  bucket: string;
  policy: string;
}

// This is the interface for our API client
export interface VastS3Api {
  getS3Buckets(): Promise<S3Bucket[]>;
}

// This creates a reference to our API that we can use to look it up
export const vastS3ApiRef = createApiRef<VastS3Api>({
  id: 'plugin.vast-s3.service',
});

// This is the actual implementation of the API client
export class VastS3ApiClient implements VastS3Api {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  // Helper function to get the base URL of our backend
  private async getBaseUrl() {
    return this.discoveryApi.getBaseUrl('vast-s3');
  }

  // This function fetches the list of S3 Buckets
  async getS3Buckets(): Promise<S3Bucket[]> {
    // 1. Get the URL for our backend plugin
    const backendUrl = await this.getBaseUrl();

    // 2. Fetch the bearer token from our new /token endpoint
    const tokenResponse = await this.fetchApi.fetch(`${backendUrl}/token`);
    const { token } = await tokenResponse.json();

    // 3. Get the URL for the Backstage proxy to the VAST API
    const proxyUrl = await this.discoveryApi.getBaseUrl('proxy');

    // 4. Make the authenticated request to the VAST API via the proxy
    const bucketsResponse = await this.fetchApi.fetch(
      `${proxyUrl}/vast-api/latest/views/?bucket__regex=^.%2B$&fields=bucket,policy,s3_versioning`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!bucketsResponse.ok) {
      throw new Error(`Failed to fetch S3 buckets: ${bucketsResponse.statusText}`);
    }
    const data = await bucketsResponse.json();
    return data as S3Bucket[];
  }
}