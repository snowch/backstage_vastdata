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
  // Now it calls the backend directly, which handles VAST authentication
  async getS3Buckets(): Promise<S3Bucket[]> {
    console.log('Fetching S3 buckets from backend...');
    
    // Get the URL for our backend plugin
    const backendUrl = await this.getBaseUrl();
    console.log('Backend URL:', backendUrl);

    // Call our new /buckets endpoint
    // The backend handles all VAST authentication internally
    const bucketsUrl = `${backendUrl}/buckets`;
    console.log('Requesting buckets from:', bucketsUrl);
    
    const bucketsResponse = await this.fetchApi.fetch(bucketsUrl);

    console.log('Response status:', bucketsResponse.status, bucketsResponse.statusText);

    if (!bucketsResponse.ok) {
      const errorBody = await bucketsResponse.text();
      console.error('Failed to fetch buckets:', errorBody);
      throw new Error(`Failed to fetch S3 buckets: ${bucketsResponse.status} ${bucketsResponse.statusText}`);
    }
    
    const data = await bucketsResponse.json();
    console.log('Successfully fetched buckets, count:', data?.length);
    return data as S3Bucket[];
  }
}