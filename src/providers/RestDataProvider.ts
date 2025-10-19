import type { Bundle } from '../types';
import type { DataProvider, FacetSummary, SearchParams } from './DataProvider';

const DEFAULT_BASE_URL = '/api';

export class RestDataProvider implements DataProvider {
  private readonly baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // TODO: Replace with GET `${this.baseUrl}/bundles/search` using query-string params from SearchParams.
  async listBundles(_params: SearchParams): Promise<{ items: Bundle[]; total: number }> {
    throw new Error(`RestDataProvider.listBundles not implemented. Expected GET ${this.baseUrl}/bundles/search`);
  }

  // TODO: Replace with GET `${this.baseUrl}/bundles/:id` returning a Bundle payload.
  async getBundleById(id: string): Promise<Bundle | null> {
    throw new Error(`RestDataProvider.getBundleById not implemented. Expected GET ${this.baseUrl}/bundles/${id}`);
  }

  // TODO: Replace with GET `${this.baseUrl}/bundles/facets` returning regions/providers/tags/price ranges.
  async listFacets(): Promise<FacetSummary> {
    throw new Error(`RestDataProvider.listFacets not implemented. Expected GET ${this.baseUrl}/bundles/facets`);
  }
}

export default RestDataProvider;
